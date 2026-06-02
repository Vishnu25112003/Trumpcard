# 👑 Raja Rani Online — Implementation Plan

> **Version:** 1.0
> **Architecture:** Modular Gaming Hub (3rd game module)
> **Goal:** Build a real-time, room-code based multiplayer Raja Rani game as a plug-in module inside the existing gaming hub (alongside Trump Card & Hand Cricket).

---

## ⚙️ IMPORTANT — READ BEFORE IMPLEMENTING (Claude Code Instruction)

**Before writing any Raja Rani code, FIRST analyze the existing hub codebase:**

1. Open and study the **shared modules layer** (Room system, Socket connection layer, Lobby, UI kit, Timer, Toss/coin utilities).
2. Open and study **at least one existing game module** (preferably `Hand Cricket`) to learn the exact conventions used:
   - How a game folder is structured under `backend/games/<game>/` and `frontend/src/games/<game>/`
   - How socket events are registered and namespaced
   - How the game engine / state machine is wired into the shared room system
   - How frontend routes, components, hooks, and Tailwind/design tokens are organised
   - Naming conventions, file naming, CommonJS module patterns, error handling style
3. **Only AFTER this analysis**, start implementing Raja Rani as a new module that matches the existing conventions exactly. Reuse shared modules — do NOT rebuild the room/socket/lobby system.

> The goal: Raja Rani must feel like a native part of the hub, not a bolted-on game.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Characters & Scoring System](#3-characters--scoring-system)
4. [Locked-in Game Flow](#4-locked-in-game-flow)
5. [Modular Hub Architecture](#5-modular-hub-architecture)
6. [Folder Structure](#6-folder-structure)
7. [Database Schema](#7-database-schema)
8. [Socket.IO Event Catalog](#8-socketio-event-catalog)
9. [REST API Endpoints](#9-rest-api-endpoints)
10. [Frontend Routes & Pages](#10-frontend-routes--pages)
11. [Reusable Components Catalog](#11-reusable-components-catalog)
12. [State Management Strategy](#12-state-management-strategy)
13. [Game Logic Implementation](#13-game-logic-implementation)
14. [Animation Specifications](#14-animation-specifications)
15. [Timer, Timeout & AFK Rules](#15-timer-timeout--afk-rules)
16. [Development Phases](#16-development-phases)
17. [Environment Variables](#17-environment-variables)
18. [Deployment Plan](#18-deployment-plan)
19. [Future Enhancements](#19-future-enhancements)

---

## 1. Project Overview

### What We're Building
A real-time, room-code based multiplayer **Raja Rani** game (the classic Indian royal-court party game) playable in the browser, designed as a **modular plug-in** for the existing gaming hub.

### Modular Hub Vision
Raja Rani becomes the **3rd game** in the hub, sharing the same infrastructure as Trump Card and Hand Cricket:
- Room / lobby system
- Socket connection layer
- UI design system
- Match results display

Each game keeps its **own isolated game engine**. Raja Rani plugs into the shared infrastructure exactly the way Hand Cricket does.

### Game Summary
- **Players:** 4 to 10 per room
- **Goal:** Each character, in descending rank order, must correctly find the next character below them. The chain runs all the way down to the **Thief**.
- **Scoring:** Dummy/temporary scores for now (NOT stored, centralised only — Web3/Polygon comes later).
- **Win condition:** Whoever ends up holding the highest-rank card (Raja) earns the top score; the match ends when the Thief is found.

---

## 2. Tech Stack

> Identical to the existing hub — zero new learning curve. Match versions to the current hub.

### Frontend
- React 19 (SPA) + Vite + JSX
- React Router DOM 7
- Axios (REST)
- Socket.IO Client 4
- Tailwind CSS 3 + PostCSS + Autoprefixer
- Custom CSS in `src/index.css` and `src/styles/design.css`
- **Framer Motion** — for card deal, 3D flip, swap, and character-reaction animations
- *(optional)* Howler.js or HTML5 Audio — for the last-3-seconds timer tick sound

### Backend
- Node.js + Express 5 (CommonJS)
- Socket.IO 4 server (wrapped with native HTTP)
- CORS + dotenv

### Database
- MongoDB + Mongoose
- Reuses `Room`, `GameState`, `Match` models (extended with Raja-Rani-specific fields / `gameType`)

### Tooling
- Jest, Nodemon, ESLint

### Deployment
- Frontend: Vercel
- Backend: Render / Railway (or current hub host)

---

## 3. Characters & Scoring System

### Character Hierarchy (rank high → low)

| Rank | Character | Score |
|------|-----------|-------|
| 1 | Raja (King) | 1000 |
| 2 | Rani (Queen) | 800 |
| 3 | Mandhiri (Minister) | 600 |
| 4 | Senapathi (Commander) | 500 |
| 5 | Sipahi (Soldier) | 400 |
| 6 | Vaidyar (Royal Doctor) | 300 |
| 7 | Purohit (Priest) | 200 |
| 8 | Sevakan (Servant) | 100 |
| 9 | Bhikari (Beggar) | 50 |
| 10 | **Thief** | **0** *(always last)* |

> Scores are **dummy/temporary** — display only, not persisted.

### Character Selection by Player Count
**Rule:** Take the **top (N − 1)** characters from the ranked list above, then always append **Thief** as the last one.

| Players (N) | Characters used |
|-------------|-----------------|
| 4 | Raja, Rani, Mandhiri, **Thief** |
| 5 | Raja, Rani, Mandhiri, Senapathi, **Thief** |
| 6 | Raja, Rani, Mandhiri, Senapathi, Sipahi, **Thief** |
| 7 | + Vaidyar, **Thief** |
| 8 | + Purohit, **Thief** |
| 9 | + Sevakan, **Thief** |
| 10 | all 9 ranks + **Thief** |

### The Chain Order
The "find" chain always follows the rank order, ending at Thief:
```
Raja → Rani → Mandhiri → Senapathi → Sipahi → … → Thief
```
Each character must find the **next character below them** in this chain.

---

## 4. Locked-in Game Flow

| Step | Detail |
|------|--------|
| Landing | Create Room or Join Room |
| Create | Host creates room → gets a 6-char room code |
| Join | Player enters room code → joins lobby |
| Room Code | 6-char alphanumeric, case-insensitive, expires in 10 min *(reuse hub system)* |
| Lobby | Live player count shown; min **4**, max **10** players |
| Start | Host taps Start once ≥ 4 players have joined |
| Pre-match | Show character + score table for this match, with a **10-sec countdown** |
| Deal | After countdown, the N selected character cards are **shuffled and dealt randomly** (1 per player) |
| View phase | "View" button enabled → each player taps to **secretly view their own card** (3D flip) |
| Raja reveal | Once all players have viewed, the **Raja is revealed publicly** |
| Search turn | The current searcher (starts with Raja) gets a popup to **pick the next character** from the hidden players |
| Pick timer | **10-sec** countdown per pick *(see §15)* |
| Correct guess | Searcher locks their score; the found player is revealed, locks their score, and becomes the next searcher |
| Wrong guess | Picked card revealed → **cards swap** → picked player becomes the new searcher (holds the chain character) |
| Continue | Chain continues down the ranks |
| Skip | Already-revealed (locked) players are removed from the selectable pool |
| Timeout | Auto-pick a random eligible player; 3 timeouts in a match → AFK (lowest remaining score, skipped) |
| Match end | When the **Thief is found** (end of chain) → show final results |
| Results | Table of all players + their final earned scores (winner = highest) |
| Disconnect | 30-sec reconnect window, then forfeit *(reuse hub system)* |
| Leave | Confirmation dialog → forfeit |
| Rematch | Same room/settings → new deal |

---

## 5. Modular Hub Architecture

### Three-Layer Concept
```
┌─────────────────────────────────────────────┐
│         GAME-SPECIFIC LAYER                  │
│  (Raja Rani engine, UI, rules, animations)   │
├─────────────────────────────────────────────┤
│         SHARED MODULES LAYER                 │
│  (Room, Socket, Lobby, UI Kit, Timer)        │
├─────────────────────────────────────────────┤
│         INFRASTRUCTURE LAYER                 │
│  (Express, MongoDB, Socket.IO server)        │
└─────────────────────────────────────────────┘
```

### How Raja Rani Plugs In
1. Add `backend/games/rajarani/` → engine (state machine + rules) + socket handlers
2. Register Raja Rani socket event handlers in the shared socket layer
3. Add `frontend/src/games/rajarani/` → game-specific UI components + hooks
4. Register routes in the main router (`/rajarani/...`)
5. Reuse the shared Room, Lobby, Socket, and UI-kit modules as-is

---

## 6. Folder Structure

> Match the exact structure already used by Hand Cricket. Below is the expected shape.

### Backend
```
backend/
├── games/
│   ├── handcricket/            # existing — reference for conventions
│   └── rajarani/               # NEW
│       ├── engine/
│       │   ├── stateMachine.js     # phase transitions
│       │   ├── characters.js       # hierarchy + scores + selection logic
│       │   ├── dealer.js           # shuffle & deal cards
│       │   ├── chain.js            # find-chain resolution + swap logic
│       │   └── scoring.js          # lock scores, build results
│       ├── handlers/
│       │   └── socketHandlers.js   # rajarani:* socket events
│       ├── rajarani.routes.js      # REST endpoints (create/join/state)
│       └── index.js                # module registration entry
├── modules/                    # SHARED (reuse, do not rebuild)
│   ├── room/
│   ├── socket/
│   ├── lobby/
│   └── timer/
├── models/
│   ├── Room.js
│   ├── GameState.js
│   └── Match.js
├── config/
└── server.js
```

### Frontend
```
frontend/src/
├── games/
│   ├── handcricket/            # existing — reference for conventions
│   └── rajarani/               # NEW
│       ├── pages/
│       │   ├── RajaRaniLobby.jsx
│       │   ├── RajaRaniGame.jsx
│       │   └── RajaRaniResults.jsx
│       ├── components/
│       │   ├── CharacterCard.jsx       # 3D flip card
│       │   ├── CardDeck.jsx            # deal animation
│       │   ├── PlayerSeat.jsx          # player around the table
│       │   ├── ScoreTable.jsx          # pre-match table + countdown
│       │   ├── SearchPopup.jsx         # "find the X" picker
│       │   ├── SwapAnimation.jsx       # two cards exchanging
│       │   ├── ReactionOverlay.jsx     # Raja celebrate / Thief caught
│       │   └── TurnTimer.jsx           # 10-sec ring + last-3s warning
│       ├── hooks/
│       │   ├── useRajaRaniSocket.js
│       │   └── useRajaRaniState.js
│       └── rajaRaniConfig.js           # characters, scores, labels
├── modules/                    # SHARED (reuse)
│   ├── room/
│   ├── socket/
│   ├── lobby/
│   └── ui/                     # buttons, modals, layout
├── styles/
│   └── design.css
└── App.jsx / router
```

---

## 7. Database Schema

### Room (reuse hub model — add `gameType`)
| Field | Type | Notes |
|-------|------|-------|
| code | String | 6-char, unique, case-insensitive |
| gameType | String | `"rajarani"` |
| hostId | String | socket / player id |
| players | Array | `{ id, name, connected }` |
| maxPlayers | Number | 4–10 |
| status | String | `waiting` / `in_progress` / `ended` |
| expiresAt | Date | 10-min TTL |

### GameState (Raja Rani specific)
| Field | Type | Notes |
|-------|------|-------|
| roomCode | String | FK to Room |
| phase | String | `lobby` / `countdown` / `viewing` / `searching` / `ended` |
| chainOrder | Array | ordered character keys, e.g. `["raja","rani",...,"thief"]` |
| seats | Array | per player: `{ playerId, name, card, viewed, revealed, lockedScore, timeoutStrikes, afk }` |
| currentSearchIndex | Number | index into `chainOrder` (0 = Raja) |
| turnDeadline | Date | server timestamp for 10-sec timeout |
| results | Array | final `{ playerId, name, character, score, rank }` |
| createdAt / updatedAt | Date | |

> **`card`** = character key currently held by that seat (changes on swap).
> **`revealed`/`lockedScore`** = set once a player is confirmed/locked in the chain.

### Match (optional history — for later, currently scores NOT persisted)
| Field | Type | Notes |
|-------|------|-------|
| roomCode | String | |
| gameType | String | `"rajarani"` |
| results | Array | final standings |
| endedAt | Date | |

> ⚠️ For now scores are temporary/dummy. Persisting Match is optional and can stay disabled until Web3 phase.

---

## 8. Socket.IO Event Catalog

> Namespaced `rajarani:*`. Server is **authoritative** — all logic runs server-side (anti-cheat).

### Client → Server
| Event | Payload | Purpose |
|-------|---------|---------|
| `rajarani:create` | `{ name, maxPlayers }` | create room |
| `rajarani:join` | `{ code, name }` | join room |
| `rajarani:start` | `{ code }` | host starts (validates ≥4 players) |
| `rajarani:viewCard` | `{ code }` | mark own card as viewed |
| `rajarani:pick` | `{ code, targetPlayerId }` | searcher picks a player |
| `rajarani:leave` | `{ code }` | leave / forfeit |
| `rajarani:rematch` | `{ code }` | request rematch |

### Server → Client (broadcast)
| Event | Payload | Purpose |
|-------|---------|---------|
| `rajarani:lobbyUpdate` | `{ players, count, maxPlayers }` | live lobby roster |
| `rajarani:countdown` | `{ characters, scores, secondsLeft }` | pre-match table + 10s countdown |
| `rajarani:dealt` | `{ seats (cards hidden) }` | cards dealt, trigger deal animation |
| `rajarani:viewState` | `{ viewedCount, total }` | how many have viewed |
| `rajarani:yourCard` | `{ character }` | **private** — only to that player |
| `rajarani:rajaRevealed` | `{ playerId, name }` | Raja shown publicly |
| `rajarani:turn` | `{ searcherId, targetCharacter, eligiblePlayerIds, deadline }` | start a search turn |
| `rajarani:pickResult` | `{ pickedPlayerId, pickedCharacter, correct }` | reveal pick outcome |
| `rajarani:swap` | `{ searcherId, pickedPlayerId }` | trigger swap animation |
| `rajarani:locked` | `{ playerId, character, score }` | a player locked their score |
| `rajarani:reaction` | `{ type: "celebrate"|"caught", playerId }` | reaction overlay |
| `rajarani:afk` | `{ playerId }` | player marked AFK |
| `rajarani:ended` | `{ results }` | final standings |
| `rajarani:error` | `{ message }` | validation / flow errors |

---

## 9. REST API Endpoints

> Most flow is over sockets; REST handles lightweight setup/recovery (mirror Hand Cricket).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/rajarani/room` | create room (returns code) |
| GET | `/api/rajarani/room/:code` | validate code / fetch room meta |
| GET | `/api/rajarani/state/:code` | fetch current game state (reconnect recovery) |

---

## 10. Frontend Routes & Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/rajarani` | Landing | Create / Join buttons |
| `/rajarani/lobby/:code` | RajaRaniLobby | roster, player count, host Start |
| `/rajarani/game/:code` | RajaRaniGame | table, cards, search popup, timer, animations |
| `/rajarani/results/:code` | RajaRaniResults | final standings table |

---

## 11. Reusable Components Catalog

### Shared (already in hub — reuse)
- Room create/join forms
- Lobby roster + player count
- Socket provider / connection hook
- UI kit: Button, Modal, Toast, Layout, CountdownRing
- Disconnect/reconnect handler (30-sec window)

### Game-specific (build new)
| Component | Purpose |
|-----------|---------|
| `CharacterCard` | 3D flip card (front = character, back = pattern) |
| `CardDeck` | deal-out animation to seats |
| `PlayerSeat` | player avatar/name around the table + state badges |
| `ScoreTable` | pre-match character + score table with 10-sec countdown |
| `SearchPopup` | "Find the {character}" — shows eligible hidden players |
| `SwapAnimation` | two cards visually exchanging positions |
| `ReactionOverlay` | Raja celebrate / Thief caught reactions |
| `TurnTimer` | 10-sec ring; red pulse + tick in last 3 seconds |
| `ResultsTable` | final standings with ranks + scores |

---

## 12. State Management Strategy

- **Server-authoritative**: the backend `GameState` is the single source of truth. The client only renders what the server broadcasts and sends intents (`pick`, `viewCard`).
- **Frontend**: React Context per game session + custom hooks (`useRajaRaniSocket`, `useRajaRaniState`) — same pattern as Hand Cricket.
- **Private vs public state**: each player only ever receives their own card via `rajarani:yourCard`. All other cards stay hidden client-side until revealed by the server.
- **Reconnect**: on reload, client calls `GET /api/rajarani/state/:code` + re-subscribes to socket room to rebuild UI.

---

## 13. Game Logic Implementation

### Phase State Machine
```
lobby → countdown → viewing → searching → ended
```
- **lobby**: players join (4–10). Host can start at ≥4.
- **countdown**: show character+score table, 10-sec timer.
- **viewing**: deal cards; each player views their own; once all viewed → reveal Raja.
- **searching**: chain resolution loop (below) until Thief is found.
- **ended**: build + broadcast results.

### Setup (character assignment & deal)
```js
function setupMatch(players) {
  const N = players.length;                 // 4..10
  const RANKED = ["raja","rani","mandhiri","senapathi","sipahi",
                  "vaidyar","purohit","sevakan","bhikari"]; // Thief separate
  const selected = RANKED.slice(0, N - 1);  // top (N-1)
  selected.push("thief");                   // Thief always last
  // selected = chainOrder (rank order)

  const dealt = shuffle([...selected]);     // random deal
  const seats = players.map((p, i) => ({
    playerId: p.id, name: p.name,
    card: dealt[i],
    viewed: false, revealed: false,
    lockedScore: null, timeoutStrikes: 0, afk: false,
  }));

  return { chainOrder: selected, seats, currentSearchIndex: 0 };
}
```

### Helper functions
```js
const holderOf = (state, charKey) =>
  state.seats.find(s => s.card === charKey);

const scoreOf = (charKey) => SCORES[charKey]; // from §3 table

// eligible = not locked, not the searcher, not AFK
function eligibleTargets(state) {
  const searcher = holderOf(state, state.chainOrder[state.currentSearchIndex]);
  return state.seats.filter(s =>
    !s.revealed && !s.afk && s.playerId !== searcher.playerId);
}
```

### Search turn resolution (the heart of the game)
```js
function onPick(state, targetPlayerId) {
  const idx = state.currentSearchIndex;
  const searcherChar = state.chainOrder[idx];        // e.g. "raja"
  const targetChar   = state.chainOrder[idx + 1];    // e.g. "rani"
  const searcher = holderOf(state, searcherChar);
  const picked   = state.seats.find(s => s.playerId === targetPlayerId);

  // reveal the picked card (flip animation client-side)
  emit("pickResult", { pickedPlayerId: picked.playerId,
                       pickedCharacter: picked.card,
                       correct: picked.card === targetChar });

  if (picked.card === targetChar) {
    // ---- CORRECT ----
    lock(searcher, scoreOf(searcherChar));   // confirm searcher (idempotent)
    lock(picked,   scoreOf(targetChar));     // confirm found target
    emit("reaction", { type: "celebrate", playerId: searcher.playerId });

    state.currentSearchIndex += 1;
    if (state.chainOrder[state.currentSearchIndex] === "thief") {
      // the just-found target IS the Thief → end
      return endMatch(state);
    }
    startTurn(state);   // found player is now the searcher
  } else {
    // ---- WRONG → SWAP ----
    swapCards(searcher, picked);             // chain char moves to picked
    emit("swap", { searcherId: searcher.playerId, pickedPlayerId: picked.playerId });
    emit("reaction", { type: "caught", playerId: picked.playerId }); // optional
    startTurn(state);   // picked player now holds chain char = new searcher
  }
}

function lock(seat, score) {                 // idempotent
  if (!seat.revealed) { seat.revealed = true; seat.lockedScore = score; }
}

function swapCards(a, b) { const t = a.card; a.card = b.card; b.card = t; }
```

### Starting a turn
```js
function startTurn(state) {
  const idx = state.currentSearchIndex;
  const searcher = holderOf(state, state.chainOrder[idx]);
  const targetChar = state.chainOrder[idx + 1];
  state.turnDeadline = Date.now() + 10_000;  // 10 sec
  emit("turn", {
    searcherId: searcher.playerId,
    targetCharacter: targetChar,
    eligiblePlayerIds: eligibleTargets(state).map(s => s.playerId),
    deadline: state.turnDeadline,
  });
  scheduleTimeout(state);                    // see §15
}
```

### End match
```js
function endMatch(state) {
  state.phase = "ended";
  const results = state.seats
    .map(s => ({ playerId: s.playerId, name: s.name,
                 character: s.card, score: scoreOf(s.card) }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  emit("ended", { results });
}
```

> **Worked example (4 players):** deal P1=Raja, P2=Mandhiri, P3=Rani, P4=Thief.
> Raja(P1) wrongly picks P2 → swap → P2=Raja, P1=Mandhiri. P2(Raja) picks P3=Rani ✅ → lock P2=1000, P3=700. P3(Rani) picks P1=Mandhiri ✅ → lock P1=600. P1(Mandhiri) picks P4=Thief ✅ → lock P4=0 → **end**.
> Final: P2 Raja 1000, P3 Rani 700, P1 Mandhiri 600, P4 Thief 0.

---

## 14. Animation Specifications

| Animation | Trigger | Behaviour |
|-----------|---------|-----------|
| **Deal-out** | `rajarani:dealt` | cards fly from a central deck to each seat |
| **3D flip** | view own card / reveal a card | card rotates Y-axis, back → front |
| **Swap** | `rajarani:swap` | the two cards slide/arc and exchange seat positions |
| **Reaction — celebrate** | correct find | winner seat pops + glow / confetti (Raja celebrate) |
| **Reaction — caught** | Thief found / wrong pick | "Thief caught" stamp / shake |
| **Timer warning** | last 3 sec of a turn | timer ring turns red + pulses; optional tick sound |

> Use **Framer Motion** for all of the above. Keep animations short (≈300–600ms) so the game stays snappy.

---

## 15. Timer, Timeout & AFK Rules

### Per-turn timer
- Every search turn has a **10-second** countdown (`turnDeadline` set server-side).
- Client shows a `TurnTimer` ring; last 3 seconds → red pulse + optional tick sound.

### Timeout behaviour (Option A — auto-pick)
- If the searcher doesn't pick in time, the **server auto-picks a random eligible player** and runs `onPick` normally.
- Rationale: a pick is a guess anyway, so auto-pick is fair and keeps the chain intact (the chain needs the card-holder present, so elimination is NOT used).

### AFK strikes (Option B)
- Each timeout increments that seat's `timeoutStrikes`.
- On the **3rd timeout in a match**, the player is marked **AFK**:
  - Removed from the eligible-target pool (`afk = true`, skipped in picks).
  - Auto-assigned the **lowest remaining score** at match end.
- Pairs with the shared **30-sec reconnect** rule: a disconnected player can return before forfeit.

```js
function onTurnTimeout(state) {
  const searcher = holderOf(state, state.chainOrder[state.currentSearchIndex]);
  searcher.timeoutStrikes += 1;
  if (searcher.timeoutStrikes >= 3) {
    searcher.afk = true;
    emit("afk", { playerId: searcher.playerId });
    // NOTE: if the AFK player holds the chain card, hand the search to a
    // random eligible player via a forced swap so the chain never stalls.
  }
  const pool = eligibleTargets(state);
  const random = pool[Math.floor(Math.random() * pool.length)];
  onPick(state, random.playerId);   // auto-pick
}
```

> **Edge case to handle:** if the current searcher goes AFK, force-swap the chain card to a random active player so the search can continue.

---

## 16. Development Phases

| Phase | Scope | Output |
|-------|-------|--------|
| **0 — Analyze** | Study shared modules + Hand Cricket conventions (see top instruction) | notes / conventions checklist |
| **1 — Scaffold** | Create `backend/games/rajarani/` + `frontend/src/games/rajarani/`, register routes & socket namespace | module wired into hub |
| **2 — Lobby** | Create/Join, room code (reuse), live roster, host Start (≥4) | working lobby |
| **3 — Setup & deal** | Character selection, shuffle/deal, countdown + score table | deal flow + view phase |
| **4 — Chain engine** | `onPick`, swap, lock, Raja reveal, end match (server-authoritative) | full game loop (no anim) |
| **5 — Timer/AFK** | 10-sec turns, auto-pick timeout, AFK strikes, reconnect | robust turns |
| **6 — UI & animations** | Cards, table, search popup, Framer Motion (deal/flip/swap/reaction), timer warning | polished UI |
| **7 — Results & rematch** | Standings table, rematch, leave/forfeit | end-to-end playable |
| **8 — Test & deploy** | Jest unit tests for chain logic, ESLint, deploy | shipped module |

---

## 17. Environment Variables

> Reuse the hub `.env`. No new mandatory keys for Raja Rani (centralised, no Web3 yet).

```env
# Backend (existing)
PORT=...
MONGODB_URI=...
CLIENT_ORIGIN=...

# Frontend (existing)
VITE_API_URL=...
VITE_SOCKET_URL=...
```

---

## 18. Deployment Plan

- **Frontend:** Vercel (same project / same build as the hub).
- **Backend:** Render / Railway (same service as the hub — Raja Rani is just another registered game module).
- No separate infra: the new module ships with the existing hub deployment.

---

## 19. Future Enhancements

- **Web3 / Polygon integration** — connect to the centralised → decentralised path: real MATIC rewards, wallet auth, on-chain results (aligns with the Trump Card / hub blockchain direction).
- **Persisted Match history & leaderboard** — enable the `Match` model once scores become real.
- **Token staking** per room (entry stake → winner pot).
- **Anti-collusion** measures for the search/swap phase.
- **Spectator mode** for full rooms.
- **Custom scoring profiles** — let the host pick a scoring preset.
- **Sound pack** — character voice lines / reactions.

---

> **Reminder for the implementer:** Phase 0 (analyze the existing hub) is mandatory before any code. Raja Rani must reuse the shared Room/Socket/Lobby modules and match Hand Cricket's conventions exactly.
