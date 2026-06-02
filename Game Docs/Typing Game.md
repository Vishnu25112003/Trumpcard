# ⌨️ Typing Game Online — Implementation Plan

> **Version:** 1.0
> **Architecture:** Modular Gaming Hub (4th game module)
> **Format:** Centralised (real-time over Socket.IO + local game loop — no blockchain)
> **Goal:** Build a typing game as a plug-in module inside the existing hub (alongside Trump Card, Hand Cricket & Raja Rani) with two modes:
> - **Solo Mode** — a single-player *typing-defense bottle shooter* (think *ZType* with bottles)
> - **Friends Mode** — a real-time multiplayer *typing race* (think *TypeRacer* with vehicles)

---

## ⚙️ IMPORTANT — READ BEFORE IMPLEMENTING (Claude Code Instruction)

**Before writing any Typing Game code, FIRST analyze the existing hub codebase:**

1. Open and study the **shared modules layer** (Room system, Socket connection layer, Lobby, UI kit, Timer, Countdown, Toss/coin utilities, match-history hook).
2. Open and study **at least one existing game module** (preferably `Hand Cricket`, since it is also real-time + room-code based) to learn the exact conventions:
   - How a game folder is structured under `backend/games/<game>/` and `frontend/src/games/<game>/`
   - How socket events are registered and namespaced
   - How a game engine / state machine wires into the shared room system
   - How frontend routes, components, hooks, and Tailwind/design tokens are organised
   - Naming conventions, file naming, module patterns (CommonJS / ESM), error-handling style
3. **Only AFTER this analysis**, implement Typing Game as a new module that matches the existing conventions **exactly**. Reuse the shared room/socket/lobby/UI system — do **NOT** rebuild it.
4. **Solo Mode** is fully local (no sockets). **Friends Mode** reuses the shared real-time room infrastructure. Keep the two engines isolated but sharing the typing-input + word/paragraph data layer.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Locked-in Decisions](#2-locked-in-decisions)
3. [Tech Stack](#3-tech-stack)
4. [Modular Hub Integration](#4-modular-hub-integration)
5. [Folder Structure](#5-folder-structure)
6. [Solo Mode — Game Flow](#6-solo-mode--game-flow)
7. [Solo Mode — Mechanics & Rules](#7-solo-mode--mechanics--rules)
8. [Friends Mode — Game Flow](#8-friends-mode--game-flow)
9. [Friends Mode — Mechanics & Rules](#9-friends-mode--mechanics--rules)
10. [Typing Input Engine (shared)](#10-typing-input-engine-shared)
11. [Word & Paragraph Data Model](#11-word--paragraph-data-model)
12. [Socket.IO Event Catalog (Friends Mode)](#12-socketio-event-catalog-friends-mode)
13. [State Management Strategy](#13-state-management-strategy)
14. [Frontend Routes & Screens](#14-frontend-routes--screens)
15. [Reusable Components Catalog](#15-reusable-components-catalog)
16. [Scoring & Stats](#16-scoring--stats)
17. [Adaptive View for Large Lobbies](#17-adaptive-view-for-large-lobbies)
18. [Edge Cases & Disconnect Handling](#18-edge-cases--disconnect-handling)
19. [Development Phases](#19-development-phases)
20. [Environment Variables](#20-environment-variables)
21. [Future Enhancements](#21-future-enhancements)

---

## 1. Project Overview

### What We're Building
A browser-based typing game offered as the **4th module** in the gaming hub. The player lands on a **mode-select screen** and chooses:

- **Solo Mode** — Words appear on falling bottles. A gun sits at the bottom. The player types a word to lock + shoot the matching bottle. A defended **barrier** has HP; every bottle that slips through removes HP. Difficulty ramps every 30 seconds. Last as long as possible.
- **Friends Mode** — A real-time typing race. Players join a room, each gets a vehicle, and on a countdown they race to type a shared paragraph. Vehicles advance with correct typing. Players are ranked 1st → last.

### Why It Fits the Hub
- Uses the **same shared infrastructure** (room/lobby, sockets, UI kit, countdown, match list) — only the game engines are new.
- Centralised + real-time, no chain dependency → fast to ship.
- A typing game broadens the hub beyond card/cricket/positional games.

### Design References (for feel, not code copying)
- **Solo** ≈ *ZType* (type-to-shoot, auto-lock targeting, escalating waves)
- **Friends** ≈ *TypeRacer* (shared text, live progress, vehicles racing on a track)

---

## 2. Locked-in Decisions

These are confirmed and must not be re-litigated during implementation.

### Solo Mode
| # | Decision |
|---|----------|
| 1 | **Auto-lock typing** — when the player starts typing, the bottle whose word matches the typed prefix is locked; completing the word fires the gun and destroys that bottle. |
| 2 | **Bottle fall speed in tiers**: `LOW → MEDIUM → HIGH`, tied to difficulty phase. |
| 3 | **Barrier HP system** — the barrier has hit points; each bottle that reaches it removes 1 HP; game over at 0 HP (implementation of exact HP value left to dev convenience — default **5**). |
| 4 | **Difficulty ramps every 30s** — longer/rarer words **+** faster fall tier **+** more bottles per wave. |
| 5 | **Backspace to fix typos** — no hard word reset; a wrong character must be backspaced out. |
| 6 | **Scores are temporary** — kept in-session only (resets on reload). No persistence / no match-history save for Solo. |

### Friends Mode
| # | Decision |
|---|----------|
| 1 | **Unlimited players** (technically uncapped; view adapts — see §17). |
| 2 | **Vehicle advances in proportion to % of paragraph correctly typed.** |
| 3 | **Same paragraph for everyone** in a round; a **different paragraph on replay/rematch**. |
| 4 | **Per-character locking** — a wrong letter blocks progress until corrected. |
| 5 | **Default end + ranking** — rank everyone 1st → last with WPM + accuracy on a results screen; race ends when the last player finishes; **5-minute hard cap**. |
| 6 | **Simple racing** — no AFK strike/penalty system; disconnect = DNF. |

### Assumed defaults (no objection raised)
- **Word/paragraph source:** bundled JSON pools by difficulty (no external API).
- **Platform:** desktop-first; on-screen mobile keyboard support as a stretch goal.

---

## 3. Tech Stack

> Reuse the hub's existing stack. Do not introduce new frameworks.

- **Frontend:** React (hub's existing version), Tailwind / hub design tokens, `requestAnimationFrame` game loop for Solo, hub's socket client for Friends.
- **Backend:** Node.js + Express + **Socket.IO** (Friends mode only), reusing the shared room/lobby manager.
- **Animation:** CSS transforms + RAF for Solo (bottle fall, gun fire, explosions); CSS transitions for Friends vehicle movement.
- **Data:** Bundled JSON (`words.json`, `paragraphs.json`).
- **State:** Local React state for Solo; socket-driven shared state for Friends (via the hub's existing store/connection layer).
- **Persistence:** None new. (Solo = temporary; Friends results optional in existing match list, see §16.)

---

## 4. Modular Hub Integration

The module registers itself with the hub the same way existing games do.

- **Module key:** `typing-game`
- **Display name:** `Typing Game`
- **Modes exposed:** `solo`, `friends`
- **Shared services consumed:**
  - Room/Lobby manager (Friends only)
  - Socket connection layer (Friends only)
  - UI kit (buttons, modal, card, HUD primitives, Countdown)
  - Match list / history hook (Friends only, optional)
- **Backend registration:** export the module from `backend/games/typing-game/index.js` and register its socket handlers under the `typing:` namespace through the hub's central registrar (mirror Hand Cricket).
- **Frontend registration:** export the module manifest/route from `frontend/src/games/typing-game/index.jsx` so it appears on the hub home grid.

---

## 5. Folder Structure

> Match the actual hub conventions discovered in step 0. Below is the intended shape.

```
backend/
└── games/
    └── typing-game/
        ├── index.js                 # module registration + socket handler wiring
        ├── config.js                # constants: HP, fall tiers, timings, max paragraph time
        ├── data/
        │   ├── words.json           # word pools by difficulty (easy/medium/hard)
        │   └── paragraphs.json      # paragraph pools by difficulty
        ├── engine/
        │   ├── raceEngine.js        # Friends race state machine (per room)
        │   └── scoring.js           # WPM / accuracy / ranking helpers
        └── socket/
            └── handlers.js          # typing:* event handlers (Friends only)

frontend/
└── src/
    └── games/
        └── typing-game/
            ├── index.jsx            # module manifest + route entry
            ├── TypingHome.jsx       # mode-select screen (Solo / Friends)
            ├── shared/
            │   ├── hooks/
            │   │   ├── useTypingInput.js   # keystroke buffer + correctness logic
            │   │   └── useGameLoop.js       # RAF loop (Solo)
            │   ├── data/loadWords.js
            │   └── utils/typingMath.js      # wpm, accuracy, progress %
            ├── solo/
            │   ├── SoloGame.jsx
            │   ├── components/
            │   │   ├── Bottle.jsx
            │   │   ├── Gun.jsx
            │   │   ├── Projectile.jsx
            │   │   ├── Barrier.jsx          # the "road" with HP bar
            │   │   ├── SoloHUD.jsx          # score, HP, phase, timer, WPM
            │   │   └── SoloGameOver.jsx
            │   └── soloEngine.js            # spawn, fall, collision, difficulty phases
            └── friends/
                ├── FriendsLobby.jsx         # reuse shared room/lobby UI
                ├── RaceScreen.jsx
                ├── ResultsScreen.jsx
                └── components/
                    ├── Countdown.jsx        # reuse shared Countdown if available
                    ├── Track.jsx
                    ├── Vehicle.jsx
                    ├── ParagraphView.jsx    # renders text with correct/wrong/cursor states
                    ├── ProgressLeaderboard.jsx  # compact view for large lobbies
                    └── PlayerResultRow.jsx
```

---

## 6. Solo Mode — Game Flow

1. Player selects **Solo** on `TypingHome`.
2. Brief start overlay ("Type the words to shoot the bottles. Don't let them reach the barrier!") → **Start**.
3. Game loop begins:
   - Bottles spawn at random X positions at the top and fall toward the barrier.
   - Each bottle carries a word label.
   - The gun sits at the bottom center; the **barrier (road)** sits just above the gun with an **HP bar**.
4. Player types:
   - First correct keystroke **auto-locks** the matching bottle (closest-to-barrier wins ties).
   - Each subsequent correct character advances the locked word; the bottle shows progress (typed portion dimmed).
   - On word completion → gun fires a projectile → bottle explodes → score++ → lock releases.
   - A wrong key shows a red error char; player **backspaces** to continue.
5. If a bottle crosses the barrier line → barrier **HP −1**, bottle removed, any lock on it released.
6. **Every 30s** the difficulty **phase** advances (faster fall tier, harder/longer words, more bottles).
7. When barrier **HP = 0** → **Game Over** → show stats (score, time survived, WPM, accuracy, bottles destroyed) → **Retry** / **Back to Hub**. Stats are temporary.

---

## 7. Solo Mode — Mechanics & Rules

### Auto-lock targeting
- **No lock + key pressed:** find all on-screen bottles whose word's first character equals the key. Among matches, lock the one **closest to the barrier** (lowest Y / most urgent). If none match, the keystroke is ignored (optional subtle "miss" feedback).
- **Locked:** keystrokes are compared against the locked word via the shared typing buffer (§10). Backspace clears errors. Word completes when `buffer === word` → fire.
- Only **one bottle** is locked at a time. Lock auto-releases on completion or when the locked bottle crosses the barrier.

### Barrier (the "road") + HP
- Horizontal barrier line above the gun, rendered with an **HP bar** (default `MAX_HP = 5`, in `config.js`).
- Bottle crossing the barrier Y → `hp -= 1`, bottle destroyed, small screen-shake/flash.
- `hp === 0` → game over.

### Difficulty phases (every 30s)
| Phase | Time | Fall Tier | Word Pool | Spawn Interval | Max On-Screen |
|-------|------|-----------|-----------|----------------|---------------|
| 0 | 0–30s | LOW | easy (3–5 letters) | ~2.0s | 3 |
| 1 | 30–60s | MEDIUM | medium (5–7) | ~1.5s | 5 |
| 2 | 60–90s | HIGH | hard (7–10, rarer) | ~1.1s | 7 |
| 3+ | 90s+ | HIGH (capped, slight speed bump per phase) | hard | ~0.9s (floor) | 9 |

> Tune exact numbers in `config.js`. Fall tier maps to a px/sec speed (e.g. LOW 40, MEDIUM 70, HIGH 110).

### Typo handling
- Wrong character appended to buffer, rendered red; word will not complete until corrected. Player presses **Backspace** to remove it. No auto-reset, no penalty beyond lost time.

### Game loop
- Single `requestAnimationFrame` loop (`useGameLoop`) updating bottle positions, checking barrier collisions, advancing phase timer, and driving spawns. Keep React renders lean (animate via refs/transforms where possible).

---

## 8. Friends Mode — Game Flow

1. Player selects **Friends** on `TypingHome`.
2. **Host** creates a room → gets a **room code** (reuse hub room system). Friends **join** via code → land in the shared lobby.
3. Lobby lists all joined players (unlimited). Host taps **Start Race** when ready (everyone currently in the room participates).
4. Server picks a paragraph (difficulty per host setting; different from the room's last paragraph) and broadcasts it.
5. **Countdown** 3 → 2 → 1 → **GO** (reuse shared Countdown).
6. Each player types the shared paragraph with **per-character locking**:
   - Correct char → advance, vehicle moves forward.
   - Wrong char → error shown, **cannot advance** until corrected.
7. Each player's progress (% complete) is broadcast live; vehicles/progress bars update for everyone.
8. A player finishes on the last correct char → finish time + order recorded; their vehicle reaches the finish line.
9. Race ends when the **last player finishes** OR the **5-minute cap** hits (unfinished players ranked by progress).
10. **Results screen**: ranking 1st → last with WPM + accuracy. **Rematch** (new paragraph) / **Back to Hub**.

---

## 9. Friends Mode — Mechanics & Rules

### Per-character locking
- The paragraph has a current cursor index per player. Typing the **expected** character advances the cursor by 1. Typing a **wrong** character registers an error and **does not advance** — the player must type the correct character to proceed (and may backspace, but the cursor cannot pass an uncorrected position). This naturally enforces "wrong letter blocks the next word until corrected."
- Track `correctChars`, `totalKeystrokes`, and `errors` per player for accuracy.

### Progress & vehicles
- `progress = correctChars / paragraph.length` (0–1).
- Vehicle X (or progress-bar fill) = `progress * trackLength`.
- Broadcast progress on each correct char, **throttled** server-side (e.g. coalesce to ~10 updates/sec per room) to stay efficient with many players.

### Paragraph selection
- Same paragraph for all players in a round.
- On rematch within the same room, exclude the last paragraph (store `lastParagraphId` on room state) so it's fresh.

### Finish & ranking
- Finish order assigned in completion sequence (1st, 2nd, …).
- Players who don't finish before the 5-min cap or who disconnect are ranked **after** finishers, ordered by progress (DNF).
- Results show per player: **rank, WPM, accuracy, time** (or "DNF").

### Host controls
- Host selects difficulty (Easy/Medium/Hard) before start. Host start gates the race. (Keep it simple — no per-player ready toggles required unless the hub lobby already provides them.)

---

## 10. Typing Input Engine (shared)

A single hook powers correctness logic in both modes: `useTypingInput`.

**Responsibilities**
- Capture keystrokes (global keydown listener while active).
- Maintain a typed **buffer**/cursor compared against a target string.
- Classify each position as `correct | wrong | pending | cursor`.
- Handle **Backspace**.
- Expose `{ value, cursorIndex, errors, correctChars, totalKeystrokes, isComplete, reset() }`.

**Mode differences**
- **Solo:** target = the *locked word*; completion fires the gun. Wrong chars accumulate (backspace to clear).
- **Friends:** target = the *paragraph*; **strict** mode — cursor cannot advance past an uncorrected wrong char (per-character locking).

**Why share it:** identical WPM/accuracy math and keystroke handling; only the "target" and the strictness flag differ.

---

## 11. Word & Paragraph Data Model

`backend/games/typing-game/data/words.json`
```json
{
  "easy":   ["cat", "run", "blue", "type", "fast"],
  "medium": ["rocket", "puzzle", "garden", "monitor"],
  "hard":   ["synthesis", "labyrinth", "quizzical", "juxtapose"]
}
```

`backend/games/typing-game/data/paragraphs.json`
```json
{
  "easy":   [ { "id": "e1", "text": "The cat sat on the mat and..." } ],
  "medium": [ { "id": "m1", "text": "..." } ],
  "hard":   [ { "id": "h1", "text": "..." } ]
}
```

- Solo pulls **words** by current phase difficulty.
- Friends pulls a **paragraph** by host difficulty.
- Frontend may bundle a mirror copy for Solo (purely local), or fetch once on module load. Keep a single source of truth — prefer loading from one place.

---

## 12. Socket.IO Event Catalog (Friends Mode)

> Namespace all events with `typing:`. **Reuse** the hub's existing room create/join/leave events where possible; only add game-specific ones below. Solo mode uses **no sockets**.

### Client → Server
| Event | Payload | Purpose |
|-------|---------|---------|
| `typing:set_difficulty` | `{ roomId, difficulty }` | Host sets paragraph difficulty |
| `typing:start` | `{ roomId }` | Host starts the race |
| `typing:progress` | `{ roomId, correctChars }` | Player reports progress (client throttles) |
| `typing:finished` | `{ roomId, correctChars, totalKeystrokes, errors, finishTime }` | Player completed the paragraph |
| `typing:rematch` | `{ roomId }` | Host requests a new round (new paragraph) |

### Server → Client
| Event | Payload | Purpose |
|-------|---------|---------|
| `typing:lobby_update` | `{ players[] }` | Roster/difficulty changes |
| `typing:countdown` | `{ seconds }` | 3-2-1-GO ticks |
| `typing:race_start` | `{ paragraph, paragraphId, startedAt }` | Begin; carries the shared text |
| `typing:progress_update` | `{ players: [{ id, progress }] }` | Coalesced positions for all vehicles |
| `typing:player_finished` | `{ id, rank, wpm, accuracy, finishTime }` | A player crossed the line |
| `typing:race_over` | `{ results: [{ id, rank, wpm, accuracy, time, dnf }] }` | Final rankings |
| `typing:error` | `{ code, message }` | Validation / state errors |

**Server-side race engine (`raceEngine.js`)** holds per-room state: `paragraph`, `lastParagraphId`, `players{ progress, finished, finishOrder, stats }`, `startedAt`, `capTimer (5 min)`. It validates `start` (host only), assigns finish order, enforces the cap, and emits `race_over` when all finish / cap hits.

---

## 13. State Management Strategy

### Solo (local only)
- React state for HUD-level values (score, HP, phase, timer).
- Fast-moving values (bottle positions, projectiles) managed in the RAF loop via refs to avoid re-render thrash; commit to state only for HUD/score changes.
- No global store, no sockets.

### Friends (socket-driven)
- Use the hub's existing connection/store. Local component state holds **my** typing cursor; **everyone's** progress comes from `typing:progress_update`.
- Single source of truth for the paragraph = server (`race_start`). Never generate the paragraph client-side.
- Results come from `race_over`; the client renders, it does not compute final rankings.

---

## 14. Frontend Routes & Screens

| Route | Screen | Notes |
|-------|--------|-------|
| `/games/typing-game` | `TypingHome` | Mode select: Solo / Friends |
| `/games/typing-game/solo` | `SoloGame` | Local game loop |
| `/games/typing-game/friends` | `FriendsLobby` | Reuse hub lobby; create/join by code |
| `/games/typing-game/friends/race` | `RaceScreen` | Active race + vehicles/progress |
| `/games/typing-game/friends/results` | `ResultsScreen` | Final rankings |

> If the hub routes games through a single dynamic route + internal state machine (check step 0), follow that pattern instead of separate paths.

---

## 15. Reusable Components Catalog

| Component | Mode | Role |
|-----------|------|------|
| `TypingHome` | both | Mode-select cards |
| `Bottle` | solo | Falling bottle with word label + typed-progress styling |
| `Gun` | solo | Bottom gun, fires on word completion |
| `Projectile` | solo | Bullet animation gun → bottle |
| `Barrier` | solo | The "road" line + HP bar |
| `SoloHUD` | solo | Score, HP, phase, elapsed time, live WPM |
| `SoloGameOver` | solo | Temporary stats + Retry / Back |
| `Countdown` | friends | 3-2-1-GO (reuse shared if present) |
| `Track` | friends | Race track / lanes |
| `Vehicle` | friends | Per-player car; X = progress |
| `ParagraphView` | friends | Renders text with correct/wrong/cursor highlighting |
| `ProgressLeaderboard` | friends | Compact progress-bar list for large lobbies |
| `PlayerResultRow` | friends | Rank + WPM + accuracy + time |

---

## 16. Scoring & Stats

### Solo (temporary)
- **Score:** points per destroyed bottle, scaled by word length / difficulty; optional **combo multiplier** for consecutive hits without a barrier breach.
- **Tracked:** score, time survived, bottles destroyed, WPM, accuracy.
- **Persistence:** none — held in component state, shown on Game Over, lost on reload. (Optional in-memory "session best" badge only.)

### Friends
- **WPM** = `(correctChars / 5) / minutesElapsed`.
- **Accuracy** = `correctChars / totalKeystrokes * 100`.
- **Rank** = finish order; DNF ranked by progress after finishers.
- **Persistence:** optional — if the hub's match-history hook is trivial to reuse, log a lightweight race result (players, ranks, paragraph difficulty, timestamp). If not, skip; results live only on the results screen. Keep it simple per the locked decision.

---

## 17. Adaptive View for Large Lobbies

Because Friends mode is **unlimited**, the race **view** adapts (the underlying race logic is identical regardless of player count):

- **≤ 8 players:** full **vehicle-on-track** view (`Track` + `Vehicle`).
- **> 8 players:** auto-switch to **`ProgressLeaderboard`** — a compact, sorted list of horizontal progress bars (one row per player, leader on top), which scales cleanly to large groups.
- The local player's row/vehicle is always highlighted.
- Threshold lives in `config.js` (`VEHICLE_VIEW_MAX = 8`).

> If you prefer a hard cap instead of the adaptive view later, just set a max in the lobby — the engine doesn't care.

---

## 18. Edge Cases & Disconnect Handling

**Friends (kept simple — no strike system):**
- **Disconnect mid-race** → mark player `DNF`; remove their vehicle (or grey it out); race continues; they're ranked after finishers by last-known progress.
- **Host leaves in lobby** → promote next player to host (reuse hub behavior) or close room if empty.
- **Player joins after start** → blocked; can spectate or wait for next round (follow hub norms; simplest is "join only in lobby").
- **5-minute cap reached** → force `race_over`; unfinished players = DNF by progress.
- **Empty room** → tear down room + race engine state.
- **Paragraph exhaustion** (small pool) → if only one paragraph in a difficulty, allow repeat but still avoid back-to-back where possible.

**Solo:**
- **Tab blur / pause** → pause the RAF loop and freeze the timer (optional but recommended).
- **No matching bottle for a keystroke** → ignore the key (optional subtle feedback).
- **Multiple bottles share a first letter** → lock the one closest to the barrier.
- **Bottle crosses barrier while locked** → release lock, clear buffer, HP−1.

---

## 19. Development Phases

**Phase 1 — Scaffold & Hub Integration**
- Create module folders, register backend + frontend, add to hub home grid, build `TypingHome` mode-select.

**Phase 2 — Shared Typing Engine**
- Implement `useTypingInput` (buffer, correctness, backspace, strict flag) + `typingMath` (WPM/accuracy) + word/paragraph loaders.

**Phase 3 — Solo Engine (core)**
- `useGameLoop` (RAF), bottle spawn/fall, gun, auto-lock targeting, barrier + HP, collision → HP−1, difficulty phases (every 30s), game-over + temporary stats.

**Phase 4 — Solo Polish**
- Projectile + explosion animation, screen-shake on HP loss, sound, HUD juice, pause-on-blur, responsive layout.

**Phase 5 — Friends Lobby**
- Reuse room/lobby (create/join by code), roster, host difficulty select, `typing:start`, Countdown.

**Phase 6 — Friends Race Engine**
- Server `raceEngine` (paragraph pick + exclude-last, per-room state, 5-min cap), `typing:progress`/`progress_update` (throttled), strict per-character typing on client, `Track` + `Vehicle`.

**Phase 7 — Results & Rematch**
- Finish detection + ranking, `race_over`, `ResultsScreen` (rank/WPM/accuracy/time), rematch with new paragraph, adaptive `ProgressLeaderboard` view.

**Phase 8 — Edge Cases & QA**
- Disconnect/DNF, host migration, cap behavior, large-lobby view switch, cross-browser + mobile keyboard check, final polish.

---

## 20. Environment Variables

**None new required** — the module is centralised and reuses the hub's existing server, socket, and (optional) match-history config. Game constants (HP, fall-tier speeds, phase durations, 5-min cap, `VEHICLE_VIEW_MAX`) live in `config.js`, **not** in `.env`.

> If the hub uses a feature-flag/env pattern to enable modules, add a `TYPING_GAME_ENABLED` flag consistent with how the other three games are toggled.

---

## 21. Future Enhancements

- **Solo power-ups:** slow-motion, bomb (clear screen), shield (restore HP), multi-shot.
- **Persistent leaderboards:** global/weekly high scores (would lift Solo's "temporary" rule — opt-in later).
- **Custom text:** host pastes a custom paragraph in Friends mode.
- **Vehicle/theme skins** per player; cosmetic unlocks.
- **Spectator mode** for full lobbies.
- **Practice/Time-attack** Solo variants (fixed-time, endless, hardcore one-HP).
- **Difficulty by language** or code-typing mode for devs.

---

> **Build order recommendation:** ship **Solo first** (fully local, no socket complexity, fastest path to something playable), then layer in **Friends** on top of the shared typing engine. Both modes share `useTypingInput`, the word/paragraph data, and the WPM/accuracy math — build that shared layer once in Phase 2 and reuse everywhere.
