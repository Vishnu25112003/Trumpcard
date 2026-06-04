# ⌨️💥 Typing Shooter — Solo Mode Implementation Plan

> **Game name (working):** Boom Typer
> **Mode covered:** Solo (single player) — **this document only**
> **Architecture:** Modular plug-in for the existing Gaming Hub
> **Inspiration:** ZType ("type to shoot") — same core logic, reskinned as falling booms + bottom tanker
> **Status:** Design locked. Friends mode is planned for later and is explicitly **out of scope** here.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [How It Fits the Hub (Modular Architecture)](#2-how-it-fits-the-hub-modular-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Core Game Concept & Rules](#4-core-game-concept--rules)
5. [Game Entities & Data Models](#5-game-entities--data-models)
6. [Targeting & Lock-On System](#6-targeting--lock-on-system)
7. [Level System & Difficulty Progression](#7-level-system--difficulty-progression)
8. [Power Boom System](#8-power-boom-system)
9. [The Game Loop](#9-the-game-loop)
10. [State Management](#10-state-management)
11. [Folder Structure](#11-folder-structure)
12. [Component Catalog](#12-component-catalog)
13. [Screens & Game States](#13-screens--game-states)
14. [Animation & Visual Specs](#14-animation--visual-specs)
15. [Tuning Tables (Default Values)](#15-tuning-tables-default-values)
16. [Word Bank](#16-word-bank)
17. [Complete Rules Reference & Edge Cases](#17-complete-rules-reference--edge-cases)
18. [Development Phases](#18-development-phases)
19. [Friends Mode Hooks (Future)](#19-friends-mode-hooks-future)
20. [Future Enhancements](#20-future-enhancements)

---

## 1. Project Overview

### What We're Building
A real-time, browser-based **typing shooter** for solo play. Words ride on **booms** that fall from the top of the screen. A **tanker** sits at the bottom and fires letters. The player destroys a boom by typing its word; finishing the word makes the boom blast. The goal is **pure endless survival** — go as far as you can across unlimited, ever-harder levels.

### The One-Line Pitch
> ZType, but the enemies are falling booms and your ship is a bottom-mounted tanker that shoots letters.

### Why This Mode First
Solo mode contains the **entire core engine** — spawning, targeting, lock-on, scoring of progress, level ramp, power booms, win/lose logic. Friends mode (built later) does **not** rewrite any of this; it wraps this engine in the hub's shared room/socket layer and broadcasts the same events. Getting solo right means friends mode is mostly plumbing.

### Key Design Decisions (Locked)
- **Goal:** Pure endless survival. No score chase, no personal best, no leaderboard in solo. (Score/leaderboard can be added later — see §20.)
- **Lose condition:** Any boom touching the bottom = **instant game over**. No lives.
- **Targeting:** Free lock-on (player chooses any boom by typing its first letter).
- **Difficulty grows by:** more booms on screen + power booms appearing more often. **Word length and drop speed stay constant.**
- **Power booms** are spawners (faucets) that flood extra words until destroyed.

---

## 2. How It Fits the Hub (Modular Architecture)

This is the **next game module** in the hub, sitting alongside Trump Card, Hand Cricket, and Raja Rani. It follows the exact same modular philosophy: **shared infrastructure + isolated game engine.**

### What it REUSES from the hub (do not rebuild)
- Hub shell / navigation / game-select screen
- Shared UI design system (colors, fonts, buttons, modals, transitions)
- Global app routing
- The "back to hub" flow and game-over result panel patterns

### What is ISOLATED to this game (its own engine)
- The canvas game surface and render loop
- Boom / power-boom spawning
- The keystroke → lock-on → fire → blast pipeline
- Level progression and difficulty logic
- Word bank

### What solo mode does NOT need
- ❌ Socket.IO / real-time networking
- ❌ Room / lobby system
- ❌ Backend API calls during gameplay
- ❌ Database

> **Solo mode runs 100% client-side.** It only mounts inside the hub shell as a route/module. The networking layer is introduced **only** when friends mode is added (§19).

### Module boundary
```
Hub (shared)  ─────────────►  mounts  ─────────────►  <BoomTyperSolo />
   • shell/nav                                            • own canvas
   • design system                                        • own engine
   • game-select                                          • own state
```

---

## 3. Tech Stack

> Match the existing hub versions exactly — zero new learning curve. Only the rendering surface is new (a canvas-based game loop), which is local to this module.

| Layer | Choice | Notes |
|---|---|---|
| Framework | React (same version as hub) | Module is a React component tree |
| Rendering surface | HTML5 `<canvas>` | Game world drawn on canvas; UI chrome stays React |
| Game loop | `requestAnimationFrame` | Fixed-timestep update (see §9) |
| Input | Global `keydown` listener (within module) | Captures typing while the game is active |
| State | Local React state + a plain JS engine object | No global store needed for solo (see §10) |
| Styling | Hub design system | Reuse existing tokens/components |
| Backend | **None for solo** | Introduced only in friends mode |

**No new dependencies are required** beyond what the hub already uses. Everything (spawning, physics-lite falling, collision-free targeting) is plain JS + canvas.

---

## 4. Core Game Concept & Rules

### The play field
- Vertical play area. **Booms spawn at the top** at random horizontal x-positions and fall straight down at a constant speed.
- The **tanker** sits fixed at the bottom-center. It does not move; it rotates/aims toward the locked boom and fires letter-projectiles upward.
- **Multiple booms are on screen at once**, at different heights and x-positions, in **random order** (not queued).

### The core loop (player's view)
1. Booms fall from the top, each showing its word.
2. Player presses the **first letter** of any boom's word → the tanker **locks onto** that boom.
3. Each correct next letter → tanker fires a letter-projectile → that letter is "consumed" on the boom.
4. When the **last letter** is typed → the boom **blasts** (explodes) and is removed.
5. Player picks the next target by typing another boom's first letter.
6. If **any boom reaches the bottom** → **instant game over.**

### Win/lose
- **Lose:** any boom (normal **or** power boom) touches the bottom edge → game over immediately.
- **No lives.** One landing ends the run.
- **No win:** the game is endless. "Winning" = surviving as many levels as possible.

### Targeting feel (the fat/bulk rule)
At any moment, several booms float on screen. The player is free to attack them in **any order**:
- If `bulk` is near the top and `fat` is mid-screen, typing `b…u…l…k` destroys `bulk` first.
- Then typing `f…a…t` destroys `fat`.
- The player decides the order by which **first letter** they press. Nothing forces them to clear the lowest boom first (though landing one ends the game, so urgency is implicit).

---

## 5. Game Entities & Data Models

### Boom (normal)
```js
Boom = {
  id: string,            // unique
  word: string,          // e.g. "bulk"
  typedIndex: number,    // how many chars typed so far (0 = untouched)
  x: number,             // horizontal position
  y: number,             // vertical position (increases as it falls)
  speed: number,         // px per second (constant within a run)
  type: "normal",
  status: "falling" | "locked" | "blasting" | "dead"
}
```

### Power Boom (spawner)
```js
PowerBoom = {
  id: string,
  word: string,          // still must be typed to destroy it
  typedIndex: number,
  x: number,
  y: number,
  speed: number,         // falls like a normal boom
  type: "power",
  tier: number,          // 1 = small, 2 = medium, 3 = super, 4+, ... (open-ended)
  spawnEveryMs: 5000,    // emits on this interval while alive
  wordsPerEmit: number,  // = tier (small emits 1, medium 2, super 3, tier N emits N)
  lastEmitAt: number,    // timestamp of last emission
  status: "falling" | "locked" | "blasting" | "dead"
}
```

### Letter Projectile (cosmetic / feedback)
```js
Letter = {
  fromX, fromY,          // tanker muzzle
  toX, toY,              // target letter on the boom
  char: string,
  progress: number       // 0 → 1
}
```

### Engine State (the single source of truth for a run)
```js
GameState = {
  status: "menu" | "playing" | "gameover",
  level: number,                 // current level, starts at 1
  boomsClearedThisLevel: number, // counts toward the level goal
  boomsGoalThisLevel: number,    // survive this many to advance
  booms: Boom[],                 // all live booms (normal + power)
  lockedBoomId: string | null,   // currently locked target
  dropSpeed: number,             // constant for the run
  spawnIntervalMs: number,       // gap between normal-boom spawns (per level)
  maxBoomsOnScreen: number,      // cap (per level)
  elapsedMs: number
}
```

> **Note:** there is **no score field** — solo is pure survival. `level` reached is the only measure.

---

## 6. Targeting & Lock-On System

This is the **heart of the game** — getting it right is what makes typing feel good.

### State
- `lockedBoomId`: the boom the tanker is currently firing at (or `null` when idle).

### Algorithm (on each `keydown` of a letter key)

```
onKeyPress(char):
  if lockedBoomId == null:
    # Not locked → try to acquire a target
    candidates = booms where word[0] == char AND status == "falling"
    if candidates is empty:
      ignore keystroke   # nothing starts with this letter
      return
    target = candidate CLOSEST TO THE BOTTOM   # highest y value = most urgent
    target.typedIndex = 1
    target.status = "locked"
    lockedBoomId = target.id
    fireLetter(char)     # tanker shoots this letter
  else:
    # Already locked → advance only on the correct next char
    target = booms[lockedBoomId]
    nextChar = target.word[target.typedIndex]
    if char == nextChar:
      target.typedIndex += 1
      fireLetter(char)
      if target.typedIndex == target.word.length:
        blast(target)         # word complete → boom explodes
        lockedBoomId = null   # free to pick a new target
    else:
      ignore keystroke   # WRONG KEY → do nothing, stay locked, wait for correct key
```

### The two locked rules (confirmed in design)
1. **Same first letter tie-break:** if two booms start with the same letter (e.g. `fat` and `fish`), pressing that letter locks the one **closest to the bottom** (most urgent).
2. **Wrong key while locked:** the keystroke is **ignored**. The word does **not** advance, the lock is **not** broken, and the boom keeps falling. Only the **correct next letter** continues the word. (No penalty.)

### Notes
- Matching is **case-insensitive**; words are stored lowercase, input is lowercased before comparison.
- A boom in `locked` status keeps falling normally — locking does not pause it.
- Once a boom is `blasting`/`dead`, it's removed from targeting.

---

## 7. Level System & Difficulty Progression

### How a level works
- Each level has a goal: **survive a set number of booms** (`boomsGoalThisLevel`).
- A boom "counts" toward the goal when it is **destroyed** (blasted). **Words spawned by power booms count too.**
- When `boomsClearedThisLevel == boomsGoalThisLevel` → advance to the next level (brief transition), reset the counter, raise difficulty.
- **Levels are unlimited.**

### What gets harder each level (locked)
Only these two knobs change:
1. **More booms on screen at once** — the on-screen cap (`maxBoomsOnScreen`) rises and/or spawn interval shrinks.
2. **Power booms appear more often** — count per level rises and their tier escalates.

### What stays constant (locked)
- ❌ **Word length** — same common pool, same length range every level.
- ❌ **Drop speed** — constant for the whole run.

### Power boom presence by level
| Level | Power booms | Tier(s) |
|---|---|---|
| 1 | none | — |
| 2 | none | — |
| 3 | 1 | small (tier 1) |
| 4 | 2 | medium (tier 2) |
| 5 | 2 + 1 stronger | super (tier 3) |
| 6+ | keeps growing | tiers keep escalating (4, 5, …) — **no cap** |

> The **tier ladder is open-ended**, matching unlimited levels: small → medium → super → tier 4 → tier 5 → … Each higher tier emits more words per cycle (see §8).

### When does a power boom appear within a level?
Default: roughly **halfway through the level's boom goal** (the "middle of the level"). When the cleared count crosses ~50% of the goal, the level's power boom(s) begin entering. (Exact trigger point is tunable — see §15.)

---

## 8. Power Boom System

### What a power boom IS
A power boom is a **spawner** — a faucet. While it is alive on screen, it keeps **emitting extra word-booms on a timer**. Its only purpose is pressure: leave it alive and the screen floods.

### Behavior
- Every `spawnEveryMs` (default **5000ms / 5s**) while alive, it emits `wordsPerEmit` new **normal** booms at the top.
- `wordsPerEmit` equals its **tier**:
  - **Small (tier 1)** → 1 extra word every 5s
  - **Medium (tier 2)** → 2 extra words every 5s
  - **Super (tier 3)** → 3 extra words every 5s
  - **Tier N** → N extra words every 5s (open-ended)
- It **falls like a normal boom** at the same constant speed.
- It has its **own word** that must be typed to destroy it.

### Destroying it
- Typing its word fully → it blasts and **stops emitting**. That's the whole reward: shutting off the faucet. **No bonus, points, or power-up.**
- If you ignore it, it keeps flooding you until it either (a) gets destroyed or (b) reaches the bottom.

### Critical rule
- A power boom that **reaches the bottom = instant game over**, exactly like a normal boom.
- **Spawned words are always normal booms** — a power boom can never spawn another power boom (prevents runaway snowballing).
- **Spawned words count toward the level goal.**

### Emission pseudocode
```
update(powerBoom, now):
  if now - powerBoom.lastEmitAt >= powerBoom.spawnEveryMs:
    for i in 1..powerBoom.wordsPerEmit:
      spawnNormalBoom()          # always normal, never power
    powerBoom.lastEmitAt = now
```

---

## 9. The Game Loop

A fixed-timestep loop driven by `requestAnimationFrame`.

```
loop(now):
  dt = now - lastFrame
  lastFrame = now

  if status == "playing":
    update(dt, now)
    render()

  requestAnimationFrame(loop)
```

### update(dt, now)
```
1. Move every boom down:  boom.y += boom.speed * dt
2. For each live power boom: maybe emit (see §8)
3. Spawn new normal booms if:
      - time since last spawn >= spawnIntervalMs
      - AND booms on screen < maxBoomsOnScreen
4. Inject this level's power boom(s) when the ~50% goal trigger is hit
5. Check LANDING:
      if any boom.y >= bottomLine:
          status = "gameover"   # instant, no lives
          return
6. Advance any "blasting" animations; remove "dead" booms
7. Check LEVEL COMPLETE:
      if boomsClearedThisLevel >= boomsGoalThisLevel:
          nextLevel()
```

### Input handling
- A `keydown` listener (active only while `status == "playing"`) routes letter keys into the targeting algorithm (§6).
- Non-letter keys (space, shift, etc.) are ignored for matching.

### blast(boom)
```
boom.status = "blasting"     # play explosion animation
boomsClearedThisLevel += 1
# after animation frames complete → boom.status = "dead" → removed
```

---

## 10. State Management

Solo is simple enough to **not** need a global store.

- A plain JS **engine object** holds the live `GameState` and runs the loop (mutated each frame for performance — avoid re-rendering React every frame).
- The **canvas** is drawn directly from the engine state each frame.
- **React state** holds only the "chrome" that changes rarely: `status` (menu/playing/gameover), current `level`, and the level-complete banner. The engine notifies React via a lightweight callback when these change.

```
Engine (mutable, 60fps)  ──notifies──►  React (status, level)  ──renders──►  UI chrome
        │
        └── draws every frame ──►  <canvas>
```

> This split keeps the 60fps game world off React's render cycle while letting menus/overlays stay declarative.

---

## 11. Folder Structure

Lives inside the hub's games directory, mirroring how Trump Card / Hand Cricket / Raja Rani are organized.

```
src/
  games/
    boom-typer/
      index.jsx                 # module entry, mounts into hub
      SoloGame.jsx              # top-level solo component (canvas + chrome)
      engine/
        Engine.js               # game loop, update(), state
        targeting.js            # lock-on algorithm (§6)
        spawner.js              # normal + power boom spawning
        powerBoom.js            # emission logic (§8)
        levels.js               # level goals + difficulty ramp (§7, §15)
        wordBank.js             # word pool (§16)
      render/
        renderBoom.js
        renderPowerBoom.js
        renderTanker.js
        renderLetterShot.js
        renderExplosion.js
      ui/
        MenuScreen.jsx
        HUD.jsx                 # level indicator, etc.
        LevelTransition.jsx
        GameOverScreen.jsx
      config/
        tuning.js               # all tunable numbers (§15) in ONE place
      assets/
        (sprites, sounds)
```

> **Keep all tunable numbers in `config/tuning.js`** so balancing never requires touching engine logic.

---

## 12. Component Catalog

| Component | Type | Responsibility |
|---|---|---|
| `SoloGame` | React | Owns canvas ref + engine instance; switches between menu/playing/gameover |
| `MenuScreen` | React | "Start" button, brief how-to-play |
| `HUD` | React | Shows current level (and live boom count if desired) |
| `LevelTransition` | React | Brief "Level N" banner between levels |
| `GameOverScreen` | React | "Game Over — reached Level N", Retry + Back-to-Hub |
| `Engine` | JS class | The game loop and authoritative state |
| `Spawner` | JS module | Decides when/where booms appear |
| `Targeting` | JS module | Lock-on + keystroke resolution |

**Reused from the hub:** buttons, modals, page transitions, the back-to-hub control, color/font tokens.

---

## 13. Screens & Game States

```
            ┌─────────┐   Start    ┌──────────┐  boom lands  ┌────────────┐
            │  MENU   │ ─────────► │ PLAYING  │ ───────────► │ GAME OVER  │
            └─────────┘            └──────────┘              └────────────┘
                 ▲                      │ ▲                        │
                 │                      │ │ level complete          │ Retry
                 │                      ▼ │ (brief banner)          │
                 │                  (LEVEL TRANSITION)              │
                 └──────────────── Back to Hub ◄────────────────────┘
```

- **MENU:** title + Start + short instructions.
- **PLAYING:** the live game (canvas).
- **LEVEL TRANSITION:** quick "Level N" flash, then continues (no full stop).
- **GAME OVER:** "You reached Level N", Retry (restart at Level 1), Back to Hub.

---

## 14. Animation & Visual Specs

> Exact art/theme is to be finalized during build; this defines the **moments** that need animation.

| Event | Animation |
|---|---|
| Boom falling | Smooth constant descent; word label clearly readable |
| Locked boom | Highlight/outline so the player sees the active target |
| Letter typed | Tanker fires a letter-projectile from muzzle → boom; typed letters visually "fill" or grey out on the word |
| Word complete | **Boom blast** — explosion burst, screen-shake optional |
| Power boom | Distinct look per tier (size/glow/color); pulsing to signal danger |
| Power boom emits | Brief "release" flash as new booms drop from it |
| Boom lands | Impact at the bottom line → immediate game-over transition |
| Level up | Quick "Level N" banner sweep |

**Theme:** to be decided at build (e.g. neon arcade, military tanker, sci-fi). Keep it consistent with the hub's design system.

---

## 15. Tuning Tables (Default Values)

> All values live in `config/tuning.js`. These are **starting defaults** — tune by playtesting. Logic never changes when these change.

### Per-level difficulty (starting point)
| Level | Survive (booms goal) | Max booms on screen | Spawn interval | Power booms |
|---|---|---|---|---|
| 1 | 10 | 3 | 2500 ms | 0 |
| 2 | 12 | 4 | 2300 ms | 0 |
| 3 | 14 | 5 | 2100 ms | 1 × small |
| 4 | 16 | 6 | 1900 ms | 2 × medium |
| 5 | 18 | 7 | 1700 ms | 2 + 1 super |
| 6+ | +2 each level | +1 every ~2 levels | −150 ms (floor ~900 ms) | grows; tier escalates |

> Drop speed is **constant** for the whole run (suggested default: a steady, readable fall — tune so a word is comfortably typeable before landing).

### Power boom tiers
| Tier | Name | Words per emit | Interval |
|---|---|---|---|
| 1 | small | 1 | 5000 ms |
| 2 | medium | 2 | 5000 ms |
| 3 | super | 3 | 5000 ms |
| N | tier N | N | 5000 ms |

### Power boom entry trigger
- Default: power boom(s) for a level enter when `boomsClearedThisLevel >= 50%` of that level's goal (the "middle of the level"). Tunable.

---

## 16. Word Bank

- A **common English word pool** with a **consistent length range across all levels** (length does not scale with level).
- Suggested working range: **3–6 letters** (tune for comfort). All lowercase.
- Avoid placing two booms with the **identical word** on screen at the same time (prevents ambiguity; the closest-to-bottom rule already covers same-first-letter cases).
- Power booms draw from the same pool for their own word.
- Store as a simple array in `wordBank.js`; pick randomly, excluding words currently on screen.

```js
// wordBank.js (excerpt — expand to a few hundred words)
export const WORDS = ["fat","bulk","cat","fish","jump","star",
  "blast","spark","drone","plant", /* ... */];
```

---

## 17. Complete Rules Reference & Edge Cases

A single checklist of every confirmed rule:

1. Booms fall from the top at random x, constant speed; multiple on screen at once, random order.
2. Tanker is fixed at bottom-center; aims at the locked boom and fires letters.
3. First letter of any word **locks** that boom; correct subsequent letters advance it.
4. **Same first letter** on two booms → lock the one **closest to the bottom**.
5. **Wrong key while locked** → ignored; word doesn't advance; lock stays; boom keeps falling; correct next key continues.
6. Completing a word → boom **blasts**, counts toward the level goal, lock clears.
7. Matching is **case-insensitive**.
8. **Word length and drop speed are constant** across all levels.
9. **Level ends** when the player has destroyed the level's boom goal; then difficulty rises and level increments.
10. Difficulty rises via **more booms on screen** + **more/stronger power booms** only.
11. **Power boom** = spawner; emits `tier` normal words every 5s while alive; destroying it stops emission; no bonus.
12. Power boom tiers are **open-ended** (small → medium → super → tier 4 → …).
13. **Spawned words are always normal** (never power booms) and **count toward the level goal**.
14. Power booms **fall and can land** — landing = game over, same as any boom.
15. **Any boom touching the bottom = instant game over. No lives.**
16. **Goal = pure endless survival.** No score/leaderboard in solo.

### Edge cases handled
- **No boom starts with the pressed letter** → keystroke ignored (no lock).
- **Player keeps typing after a word completes but before pressing a new first letter** → those keys are ignored until a valid first letter is pressed (lock is null).
- **Two booms same first letter, one already locked** → keep advancing the locked one; the rule only matters at lock-acquisition time.
- **Screen flooded by a power boom** → expected pressure; the player must prioritize killing the power boom.
- **Level completes mid-air with booms still falling** → finish the brief transition; surviving booms carry into the next level (don't despawn them mid-fall — that would feel unfair only if it removes a near-landing threat; default: carry them over).

---

## 18. Development Phases

Build in this order so each phase is playable/testable on its own.

**Phase 1 — Skeleton & loop**
- Mount module into hub; canvas + `requestAnimationFrame` loop; draw a static tanker.

**Phase 2 — Falling booms**
- Spawn normal booms at random x; constant fall; render word labels; remove off-screen.

**Phase 3 — Typing & lock-on**
- `keydown` listener; first-letter lock; correct-letter advance; wrong-key ignore; closest-to-bottom tie-break; fire-letter animation.

**Phase 4 — Blast & game over**
- Word-complete explosion; landing detection → instant game over screen with "reached Level N" + Retry.

**Phase 5 — Levels & difficulty**
- Survive-X-to-advance; level transition banner; ramp `maxBoomsOnScreen` + spawn interval per `tuning.js`.

**Phase 6 — Power booms**
- Spawner with tiers; emission timer; ~50% entry trigger; per-level counts & escalating tiers; spawned words count toward goal; power-boom landing = game over.

**Phase 7 — Polish**
- Theme/art, sounds, screen-shake, menu, HUD; balance pass on `tuning.js`.

> After Phase 7, solo is complete. Only then start friends mode (§19).

---

## 19. Friends Mode Hooks (Future — Not Built Now)

To make the later friends mode painless, build the solo engine so it **emits clean events** rather than hard-coding UI reactions:

- `onBoomSpawned`, `onLetterTyped`, `onWordCompleted`, `onBoomLanded`, `onLevelUp`, `onGameOver`.

When friends mode comes, the hub's **shared room/socket layer** simply:
- Uses a **shared spawn seed** so all players see the same booms.
- Broadcasts each player's `onWordCompleted` / progress to render opponents.
- Decides a multiplayer win rule (e.g. last one alive, or most booms cleared).

> **Nothing in the typing/targeting engine changes** — friends mode wraps it. This is the same modular pattern as the hub's other games.

---

## 20. Future Enhancements

- Optional **score system** + personal best (currently survival-only).
- **Leaderboard** (would introduce a small backend).
- Multiple **themes/skins** selectable from the hub.
- **Difficulty modes** (casual / hardcore) by swapping `tuning.js` presets.
- **Power-ups** (e.g. clear-screen bomb) — deliberately excluded from the core design for now.
- Friends / versus mode (§19).

---

*End of Solo Mode plan. Friends mode will be documented separately once solo is complete.*
