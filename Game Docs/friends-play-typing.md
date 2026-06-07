# 🏎️⌨️ Typing Car Race — Friends (Multiplayer) Mode Implementation Plan

> **Game name (working):** Boom Typer — Friends Race
> **Mode covered:** Friends / Multiplayer (online, room-based) — **this document only**
> **Inspiration:** TypeRacer (type-to-drive) + arcade 3D car racing visuals
> **Architecture:** Modular plug-in for the existing Gaming Hub, using the hub's shared room/lobby + Socket.IO layer
> **Status:** Design locked. Visual direction set by the provided reference image (stylized arcade racing, third-person chase cam).

> ⚠️ **Important:** This is a **completely separate game from Solo mode.** Solo = the falling-boom typing shooter. Friends = this TypeRacer-style 3D car race. They share **no game engine** — only the hub shell, design system, and (for this mode) the shared networking layer. Build this independently of the solo plan.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [How It Fits the Hub](#2-how-it-fits-the-hub)
3. [Tech Stack](#3-tech-stack)
4. [End-to-End Game Flow](#4-end-to-end-game-flow)
5. [Room & Lobby System](#5-room--lobby-system)
6. [Modes & Paragraph System](#6-modes--paragraph-system)
7. [Typing → Car Movement](#7-typing--car-movement)
8. [3D Scene & Rendering](#8-3d-scene--rendering)
9. [Real-Time Sync Model](#9-real-time-sync-model)
10. [Live Position, Overtaking & Rank Panel](#10-live-position-overtaking--rank-panel)
11. [Countdown / Start](#11-countdown--start)
12. [Time Limit & Match End Rules](#12-time-limit--match-end-rules)
13. [Leaderboard](#13-leaderboard)
14. [Data Models](#14-data-models)
15. [Socket.IO Events](#15-socketio-events)
16. [Folder Structure](#16-folder-structure)
17. [Component Catalog](#17-component-catalog)
18. [Screens & States](#18-screens--states)
19. [3D Asset Pipeline (Blender → Web)](#19-3d-asset-pipeline-blender--web)
20. [Tuning Tables (Defaults)](#20-tuning-tables-defaults)
21. [Edge Cases & Disconnect Handling](#21-edge-cases--disconnect-handling)
22. [Development Phases](#22-development-phases)
23. [Future Enhancements](#23-future-enhancements)

---

## 1. Project Overview

### What We're Building
A real-time **multiplayer typing race**. Players join a room, the host picks a difficulty (paragraph length) and starts. Everyone races to type the **same paragraph** — the faster and more accurately you type, the further your **car** drives down a 3D highway. First to finish the paragraph wins; a match time limit guarantees the race always ends.

### One-Line Pitch
> TypeRacer, rendered as an arcade 3D car race — your typing speed *is* your accelerator.

### Locked Design Decisions
- **Typing → movement:** car position = **% of paragraph correctly typed**; you **must fix errors** before continuing (TypeRacer rule).
- **Modes:** easy / medium / large = **paragraph length only** (short / medium / long). Vocabulary stays normal.
- **Paragraphs:** **curated built-in bank**, grouped by length, with no-recent-repeat; full paragraph shown on screen (not word-by-word).
- **Players:** host decides count (sensible cap set later).
- **Cars:** **auto-assigned**, each player gets a distinct car (player's own Blender models → GLB).
- **View:** third-person **chase cam behind your own car**; rivals appear ahead/behind by their progress. Stylized arcade look (not photoreal).
- **Start:** traffic-signal countdown.
- **Live race:** throttled progress sync + smooth client-side interpolation; side rank panel; overtakes swap ranks instantly.
- **Time limit:** **auto-scales with paragraph length**; match ends when all finish **or** time runs out.
- **Time-out ranking:** unfinished players ranked by **% typed** at the cutoff.

---

## 2. How It Fits the Hub

Friends mode is a hub game module like Trump Card / Hand Cricket / Raja Rani, and — unlike Solo — it **does** use the hub's shared multiplayer backbone.

### Reuses from the hub (do not rebuild)
- **Room / lobby system** (room codes, join/leave, host controls)
- **Socket.IO** connection layer and event plumbing
- Hub shell, navigation, design system (buttons, modals, transitions)
- The match-result / leaderboard panel patterns

### Isolated to this game
- The 3D race scene (Three.js / react-three-fiber)
- Typing → car-position mechanic
- Paragraph bank + selection
- Race-specific socket events (progress, rank, finish)

### Centralized, not blockchain
Same path as your other games: this is the **centralized** version. Match/room state lives on the server during play; scores are shown per-match (not persisted by default — consistent with your "dummy/centralized scores first, Web3 later" approach). A blockchain/leaderboard layer is a future option (§23), not part of this build.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | React (hub version) | Module mounts into hub |
| 3D rendering | **Three.js via react-three-fiber** (+ `@react-three/drei`) | Scene, camera, cars, track |
| 3D model loading | `useGLTF` (drei) | Loads `.glb` cars (see §19) |
| Realtime client | **Socket.IO client** (hub's shared layer) | Room + race events |
| Backend | **Node + Express + Socket.IO** (hub server) | Room/match authority |
| Match state | In-memory on server (per room) | No DB needed for MVP |
| Database | **Optional / none for MVP** | Add only if persisting results |
| Styling | Hub design system | Lobby/HUD/leaderboard chrome |

> New dependency vs. the rest of the hub: **react-three-fiber + drei + three**. Everything else is already in your stack.

---

## 4. End-to-End Game Flow

```
HOST                                  OTHER PLAYERS
 │                                          
 ├─ Create room (pick mode + max players)   
 ├─ Get room code  ───────share────────►  Enter room code → Join
 │                                          │
 │◄──────────── lobby fills, cars auto-assigned ──────────►│
 │                                          │
 ├─ Start match                             │
 │                                          │
 └────────► Server picks paragraph (by mode) + broadcasts ◄┘
                         │
                 Traffic-signal countdown (3-2-1-GO)
                         │
                 ── RACE: type the paragraph ──
        cars advance by % typed · live ranks · overtakes
                         │
        Ends when ALL finish  OR  time limit reached
                         │
                 Final match LEADERBOARD
                         │
              Rematch  /  Back to Hub
```

### High-level states
`LOBBY → COUNTDOWN → RACING → FINISHED (leaderboard)`

---

## 5. Room & Lobby System

Reuses the hub's existing room/lobby infrastructure.

### Host actions
- Create room → choose **mode** (easy/medium/large) and **max players**.
- Receive a **room code** to share.
- See players join in real time.
- **Start match** (only host; enabled once ≥2 players present).

### Player actions
- Enter room code + display name → join.
- See the lobby roster and their **auto-assigned car**.
- Wait for host to start.

### Car assignment
- On join, the server assigns the next **unused car** from the car pool so every player has a **distinct** car.
- Assignment is automatic — no car-select screen (kept simple per design).
- If a player leaves, their car returns to the pool.

### Lobby rules
- Minimum 2 players to start.
- Max players = host's choice, capped at a sensible limit (see §20) so the 3D scene stays performant and the track isn't overcrowded.

---

## 6. Modes & Paragraph System

### Modes (length only)
| Mode | Paragraph length (default) |
|---|---|
| Easy | Short (~20–30 words) |
| Medium | Medium (~40–60 words) |
| Large | Long (~80–120 words) |

> Only **length** changes between modes. Vocabulary/difficulty of words stays normal across all modes.

### Source: curated built-in bank (chosen)
- A local bank of real, readable paragraphs, **grouped by length tier** (short / medium / large).
- Target size: **50–100+ paragraphs per tier** so repeats are rare.
- **No-recent-repeat:** the server tracks the last N paragraph IDs used in a room and excludes them when picking the next, so the same text doesn't show back-to-back.
- **Same paragraph for everyone:** the server picks one paragraph ID and broadcasts the text to all players, guaranteeing a fair, identical race.

### Why a curated bank (not generated / not an API)
- Multiplayer needs all players on the **identical** text — a local bank makes this instant and reliable.
- Real paragraphs read naturally; generated sentences feel awkward to type.
- No network dependency, latency, rate limits, or risk of odd/inappropriate text mid-match.
- (An online text API can be a **future** option for infinite variety — §23.)

### Display
- The **full paragraph is shown on screen** (never revealed word-by-word).
- As the player types: completed text is highlighted/greyed, the **current word** is marked, and the next characters are clearly visible.

---

## 7. Typing → Car Movement

### The mapping
- **Car position along the track = % of the paragraph correctly typed.**
  - `progress = correctCharsTyped / totalChars` → `0.0` (start line) to `1.0` (finish line).
- Reaching `1.0` = the car **crosses the finish line** and that player's finish time is recorded.

### Error handling (TypeRacer rule)
- The player must type the paragraph correctly **in order**.
- A wrong keystroke does **not** advance progress; the player must **fix the error** (backspace / correct) before continuing.
- Progress only moves forward on correctly typed characters.

### Result
- Typing speed (WPM) naturally controls how fast the car moves; accuracy controls whether it moves at all.
- The car never moves backward; it advances as correct progress increases.

---

## 8. 3D Scene & Rendering

> Visual direction is set by the reference image: **stylized arcade racing** (think mobile "Car Race 3D"), **third-person chase camera** behind the player's own car, rivals visible on the highway ahead. **Not photorealistic** — this keeps it very achievable on the web.

### The shared track
- One **linear track** from **0% (start) to 100% (finish)**.
- Every car's distance down the track = that player's % typed.

### Per-player camera (egocentric chase cam)
- Each player's camera is **locked behind their OWN car**, which stays in the **foreground** (bottom-center), exactly like the reference image.
- **Rivals** are drawn on the same track at *their* % positions, so they appear:
  - **ahead** of you if they've typed more,
  - **behind** you if they've typed less.
- Type faster → your car pulls ahead and visibly **overtakes** rivals.

### Layout
- Each player is assigned a **lane** so cars don't overlap; position **along** the lane = % typed.
- Distinct **car model** per player (their own car always recognizable in front).
- Highway/road environment with simple scenery scrolling past for speed feel.

### Rendering tech
- **react-three-fiber** scene: track mesh, lane layout, lighting, skybox/road.
- Cars loaded from **GLB** via `useGLTF` (§19), instanced/reused where possible.
- Camera rig follows the local player's car with slight smoothing for a natural chase feel.
- Keep it **stylized + optimized** (low-poly cars, baked lighting) for smooth mobile performance.

---

## 9. Real-Time Sync Model

### Authority
- **Server is authoritative** for: room state, chosen paragraph, match start/stop, the time limit, and final rankings.
- For a casual friends game, each **client computes its own % progress** and reports it; the server relays it. (Server-side validation against the known paragraph can be added later for anti-cheat — §23.)

### The "real racing look" (your Q2 answer: smooth + throttled)
This combines two layers:
1. **Throttled network updates:** a player sends a `progressUpdate` on each **word boundary** (or at minimum every ~250–500 ms), not every keystroke. Lightweight on the network.
2. **Smooth client interpolation:** every other client **interpolates** each rival car between the last known % and the new %, so cars **glide** continuously instead of teleporting.

> Result: realistic, continuous car motion (smooth) without flooding the network (throttled). This is the standard approach for multiplayer racing feel.

### Flow
```
Player types ──► local % updates ──► (throttled) progressUpdate to server
                                              │
Server broadcasts playerProgress ──► all clients ──► interpolate rival cars smoothly
```

---

## 10. Live Position, Overtaking & Rank Panel

- A **side panel** lists all players with their **live rank** (1st, 2nd, …), based on current % typed.
- Ranks recompute whenever progress updates arrive: sort players by % descending.
- **Overtaking:** if P2's % passes P1's %, P2 instantly becomes 1st and P1 drops to 2nd — both in the panel **and** visually on the track (P2's car pulls ahead).
- Finished players are pinned to the top in their finish order; still-racing players rank below by %.

---

## 11. Countdown / Start

- After the host starts, the server broadcasts `matchStarting` with the paragraph and a countdown.
- A **traffic-signal countdown** plays on every client: red → red+amber → **green = GO**.
- Typing input is **locked** until GO; the race clock and progress tracking begin on GO.

---

## 12. Time Limit & Match End Rules

### Time limit (auto-scales with length)
The cap is derived from paragraph length so every mode is fair:

```
timeLimitSeconds = ceil( (wordCount / ASSUMED_MIN_WPM) * 60 * BUFFER )
```
- `ASSUMED_MIN_WPM` ≈ 20 (a slow-but-real typist should be able to finish)
- `BUFFER` ≈ 1.2 (a little breathing room)
- Example: 50-word paragraph → `(50/20)*60*1.2 = 180s` (3 min). All tunable (§20).

A visible **countdown timer** runs during the race.

### Match end — whichever comes first
1. **All players finish** (everyone reaches 100%), **or**
2. The **time limit** is reached.

### Ranking
- **Finishers** are ranked by **finish time** (1st = fastest to 100%).
- At **time-out**, any **unfinished** players are ranked **below finishers**, by **% typed** at the cutoff (higher % = better).
- This guarantees nobody waits forever on a slow/AFK player.

---

## 13. Leaderboard

- Shown on the `FINISHED` screen once the match ends.
- Columns: **rank, player name, car, % typed (or "Finished"), time** (and WPM if you want a nice touch).
- Actions: **Rematch** (back to lobby with same players) and **Back to Hub**.
- Not persisted by default (centralized, per-match). Persistence/leaderboard history is a future option (§23).

---

## 14. Data Models

### Room (server, in-memory)
```js
Room = {
  code: string,              // share code
  hostId: string,
  mode: "easy" | "medium" | "large",
  maxPlayers: number,
  status: "lobby" | "countdown" | "racing" | "finished",
  players: Player[],
  paragraphId: string | null,
  paragraphText: string | null,
  recentParagraphIds: string[],   // for no-recent-repeat
  startedAt: number | null,
  timeLimitSec: number | null,
  carPool: string[]               // available car IDs
}
```

### Player
```js
Player = {
  id: string,
  name: string,
  carId: string,             // auto-assigned, unique in room
  progress: number,          // 0.0 → 1.0 (% typed)
  finished: boolean,
  finishTimeMs: number | null,
  rank: number | null,
  connected: boolean
}
```

### Client race state
```js
RaceState = {
  status: "lobby" | "countdown" | "racing" | "finished",
  paragraph: string,
  myProgress: number,        // local, char-accurate
  rivals: { id, name, carId, displayProgress }[], // displayProgress = interpolated
  timeLeftSec: number,
  rankings: Player[]
}
```

---

## 15. Socket.IO Events

### Client → Server
| Event | Payload | Purpose |
|---|---|---|
| `createRoom` | `{ mode, maxPlayers, name }` | Host creates room; returns `code` |
| `joinRoom` | `{ code, name }` | Join an existing room |
| `leaveRoom` | `{}` | Leave / disconnect |
| `startMatch` | `{}` | Host starts (validated host-only) |
| `progressUpdate` | `{ progress }` | Throttled, on word boundary / interval |
| `playerFinished` | `{ finishTimeMs }` | Crossed 100% |

### Server → Client
| Event | Payload | Purpose |
|---|---|---|
| `roomUpdate` | `{ players, host, mode, status }` | Lobby roster / car assignments |
| `matchStarting` | `{ paragraph, timeLimitSec, countdownMs }` | Sends paragraph + starts countdown |
| `raceStart` | `{ startAt }` | GO — unlock input, start clocks |
| `playerProgress` | `{ playerId, progress }` | Broadcast a rival's new % (clients interpolate) |
| `rankUpdate` | `{ rankings }` | Current ordered ranks (or computed client-side) |
| `playerFinished` | `{ playerId, position, finishTimeMs }` | Someone finished |
| `timeUp` | `{}` | Time limit hit |
| `matchEnded` | `{ leaderboard }` | Final results |
| `error` | `{ message }` | Bad room code, room full, etc. |

> `rankUpdate` can be computed on the server (authoritative) or derived on the client from `playerProgress` for fewer messages — pick one and be consistent.

---

## 16. Folder Structure

```
src/
  games/
    typing-race/
      index.jsx                  # module entry, mounts into hub
      FriendsRace.jsx            # top-level (manages lobby/race/leaderboard states)
      net/
        socket.js                # uses hub's shared socket layer
        events.js                # event name constants + handlers
      lobby/
        LobbyScreen.jsx
        RoomCode.jsx
        PlayerList.jsx
        ModeSelect.jsx           # host only
      race/
        RaceScene.jsx            # react-three-fiber <Canvas>
        Track.jsx
        Car.jsx                  # loads GLB, positioned by progress
        CameraRig.jsx            # chase cam behind local car
        Countdown.jsx            # traffic signal
        TypingInput.jsx          # paragraph display + capture + error logic
        RankPanel.jsx            # live side ranks
        RaceTimer.jsx
      result/
        Leaderboard.jsx
      data/
        paragraphs.js            # curated bank by length tier
      logic/
        progress.js              # % typed + error handling
        ranking.js               # sort + overtaking
        timeLimit.js             # auto-scale formula
        interpolation.js         # smooth rival motion
      assets/
        cars/                    # .glb car models
        track/                   # road, scenery
      config/
        tuning.js                # all tunable numbers (§20)
```

---

## 17. Component Catalog

| Component | Type | Responsibility |
|---|---|---|
| `FriendsRace` | React | Switches lobby / countdown / race / leaderboard |
| `LobbyScreen` | React | Room code, player list, host mode-select + start |
| `RaceScene` | r3f | The 3D world (track, cars, camera) |
| `Car` | r3f | Loads a GLB, positioned by player's progress, smoothly interpolated |
| `CameraRig` | r3f | Chase cam locked behind the local player's car |
| `Countdown` | React/r3f | Traffic-signal start sequence |
| `TypingInput` | React | Shows full paragraph, captures keys, enforces error-fix rule, computes % |
| `RankPanel` | React | Live ranks + overtaking |
| `RaceTimer` | React | Countdown to time limit |
| `Leaderboard` | React | Final results, rematch / back to hub |

**Reused from hub:** room/lobby plumbing, socket layer, buttons, modals, transitions, design tokens.

---

## 18. Screens & States

```
 ┌─────────┐ host starts ┌────────────┐  GO  ┌─────────┐ all done / time up ┌─────────────┐
 │  LOBBY  │ ──────────► │ COUNTDOWN  │ ───► │ RACING  │ ─────────────────► │ LEADERBOARD │
 └─────────┘             └────────────┘      └─────────┘                    └─────────────┘
      ▲                                                                          │ Rematch
      └──────────────────────────────────────────────────────────────────────────┘
                                   Back to Hub (any time)
```

- **LOBBY:** room code, players + cars, host picks mode, Start.
- **COUNTDOWN:** traffic-signal 3-2-1-GO; input locked.
- **RACING:** 3D scene + paragraph + rank panel + timer.
- **LEADERBOARD:** final ranks, Rematch / Back to Hub.

---

## 19. 3D Asset Pipeline (Blender → Web)

> You have the cars in Blender — here's how they get into the game.

1. **Export from Blender → glTF Binary (`.glb`).** `.blend` files cannot load directly in the browser; `.glb` is the web standard (single file: mesh + textures + materials).
2. **Optimize for web:**
   - Keep cars **low-poly** (arcade style doesn't need millions of tris).
   - **Bake** lighting/detail into textures where possible.
   - Compress textures; keep each car file small (target a few hundred KB–low MB).
   - Apply transforms and center the model's origin sensibly (so it sits on the road correctly).
3. **Load** with `useGLTF('/assets/cars/car-blue.glb')` (drei). Preload all cars during the lobby so there's no hitch at race start.
4. **Reuse/instance** the same model when possible to save memory.
5. One **car ID → GLB file** mapping in `assets/cars/`, matching the server's `carPool`.

> If you can also provide a simple **track/road** model and a couple of **scenery** props, the scene will look closer to the reference image. Otherwise a procedural road + simple props works fine.

---

## 20. Tuning Tables (Defaults)

> All values live in `config/tuning.js`. Starting defaults — adjust by playtesting; logic never changes when these change.

### Mode → paragraph length
| Mode | Word count (range) |
|---|---|
| Easy | 20–30 |
| Medium | 40–60 |
| Large | 80–120 |

### Time limit formula
| Constant | Default |
|---|---|
| `ASSUMED_MIN_WPM` | 20 |
| `BUFFER` | 1.2 |
| Formula | `ceil((wordCount / 20) * 60 * 1.2)` seconds |

| Example paragraph | Time limit |
|---|---|
| 25 words (easy) | ~90 s |
| 50 words (medium) | ~180 s |
| 100 words (large) | ~360 s |

### Networking
| Setting | Default |
|---|---|
| Progress update trigger | every completed word (min every ~300 ms) |
| Rival interpolation | smooth lerp between last → new % |

### Lobby
| Setting | Default |
|---|---|
| Min players | 2 |
| Max players cap | 6 (tune for 3D performance + track space) |
| Paragraph bank size | 50–100+ per length tier |
| No-recent-repeat memory | last 10 paragraph IDs per room |

---

## 21. Edge Cases & Disconnect Handling

- **Player disconnects mid-race:** mark `connected = false`, freeze their progress; at match end they're ranked by their last % (or DNF if 0). The **time limit** ensures the match still ends.
- **Host leaves:** promote the next player to host, or end the match gracefully and return everyone to the hub.
- **Slow/AFK player:** handled entirely by the **time limit** — others never wait beyond the cap.
- **Late join:** can't join a room already in `racing` status (lobby only); show "match in progress."
- **Room full:** reject join with an `error` event.
- **Everyone finishes early:** end immediately, don't wait for the timer.
- **Same first letters / typos:** handled by the error-fix rule (§7) — progress only advances on correct, in-order characters.
- **Two cars at identical %:** keep stable ordering (e.g., earlier-reached % or join order) so ranks don't flicker.

---

## 22. Development Phases

Build so each phase is testable on its own.

**Phase 1 — Lobby & rooms**
- Hook into hub's room/lobby + socket layer; create/join via code; host mode-select; auto car assignment; start gating (≥2 players).

**Phase 2 — Paragraph + typing core (2D first)**
- Curated bank by length; full-paragraph display; capture input with the error-fix rule; compute live % progress. Test purely as text before any 3D.

**Phase 3 — Sync**
- Throttled `progressUpdate` → server broadcast → other clients receive rivals' %. Verify ranks update.

**Phase 4 — 3D scene**
- react-three-fiber canvas; track + lanes; load GLB cars; chase cam behind local car; map % → car position.

**Phase 5 — Smooth motion + rank panel + overtaking**
- Interpolate rival cars between updates; live side rank panel; visible overtakes.

**Phase 6 — Countdown, timer & end rules**
- Traffic-signal start; time-limit countdown (auto-scaled); end on all-finish or time-up; ranking incl. time-out by %.

**Phase 7 — Leaderboard & polish**
- Final leaderboard; rematch / back-to-hub; sounds, scenery, performance pass; tune `tuning.js`.

> Test multiplayer with 2+ browser tabs/devices throughout.

---

## 23. Future Enhancements

- **Persisted results / leaderboard history** (introduce DB) — and later a **blockchain** scoreboard, matching your decentralized-game roadmap.
- **Server-side anti-cheat:** validate reported progress against the known paragraph.
- **Online text/quotes API** for infinite paragraph variety (curated bank stays the reliable default).
- **Car selection** in the lobby (currently auto-assigned).
- **Track variety / themes**, boosts/nitro tied to typing streaks (kept out of core for now).
- **Spectator mode**, private/public rooms, quick-match.

---

*End of Friends-mode plan. Solo mode (the boom-shooter) is documented separately in `typing-solo-mode.md`.*
