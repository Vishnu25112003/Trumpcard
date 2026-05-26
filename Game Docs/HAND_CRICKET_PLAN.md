# 🏏 Hand Cricket Online — Implementation Plan

> **Version:** 1.0
> **Architecture:** Modular Gaming Hub
> **Goal:** Build a real-time multiplayer Hand Cricket game as a plug-in module inside a larger gaming hub.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Locked-in Game Flow](#3-locked-in-game-flow)
4. [Modular Gaming Hub Architecture](#4-modular-gaming-hub-architecture)
5. [Folder Structure](#5-folder-structure)
6. [Database Schema](#6-database-schema)
7. [Socket.IO Event Catalog](#7-socketio-event-catalog)
8. [REST API Endpoints](#8-rest-api-endpoints)
9. [Frontend Routes & Pages](#9-frontend-routes--pages)
10. [Reusable Components Catalog](#10-reusable-components-catalog)
11. [State Management Strategy](#11-state-management-strategy)
12. [Game Logic Implementation](#12-game-logic-implementation)
13. [Development Phases](#13-development-phases)
14. [Environment Variables](#14-environment-variables)
15. [Deployment Plan](#15-deployment-plan)
16. [Future Enhancements](#16-future-enhancements)

---

## 1. Project Overview

### What We're Building
A real-time, room-code-based 1v1 Hand Cricket game playable in the browser, designed as a **modular plug-in** for a larger gaming hub.

### Modular Hub Vision
Multiple games (Trump Card, Hand Cricket, future games) share:
- Room/lobby system
- Socket connection layer
- Authentication & user profiles (future)
- UI design system
- Match history & stats

Each game has its **own isolated game engine** that plugs into the shared infrastructure.

### Why Modular?
- ✅ Add new games in days instead of weeks
- ✅ Bug fixes in shared code benefit all games
- ✅ Single deployment, multiple games
- ✅ Consistent UX across games

---

## 2. Tech Stack

### Frontend
- React 19 (SPA) + Vite 8 + JSX
- React Router DOM 7
- Axios (REST)
- Socket.IO Client 4
- Tailwind CSS 3 + PostCSS + Autoprefixer
- Custom CSS in `src/index.css` and `src/styles/design.css`

### Backend
- Node.js + Express 5 (CommonJS)
- Socket.IO 4 server (wrapped with native HTTP)
- CORS + dotenv

### Database
- MongoDB + Mongoose 9
- Models: `Room`, `GameState`, `Match`

### Tooling
- Jest 30, Nodemon, ESLint 10

### Deployment
- Frontend: Vercel
- Backend: Render / Railway (or any Node host)

---

## 3. Locked-in Game Flow

| Step | Detail |
|------|--------|
| Landing | Host or Join |
| Host | Choose Over-based (set overs) or Wicket-based (set wickets) |
| Room Code | 6-char alphanumeric, case-insensitive, expires in 10 min |
| Join | Enter code → match starts |
| Toss | Random coin flip → winner picks bat/bowl |
| Pick | Both players tap 1–6 with hand animation, 7-sec timer |
| Score | Different numbers → batsman scores; Same → OUT |
| Batsman miss | Over-based: 0 runs; Wicket-based: -1 life |
| Bowler miss | Batsman gets 1 run + bowler -1 life (both modes) |
| Both miss | 0 runs, no life lost |
| Lives | 3 per innings, resets between innings, lose all 3 = forfeit |
| Innings end | All overs done OR all wickets gone (score accumulates) |
| Innings break | Summary screen + Continue button |
| Win | Cross target = instant win; higher score wins |
| Tie | Super Over (6 balls, 1 wicket each), repeat if tied |
| Disconnect | 30-sec reconnect window, then forfeit |
| Leave | Confirmation dialog → forfeit |
| End | Scoreboard → Rematch (same room/settings) or Exit |

---

## 4. Modular Gaming Hub Architecture

### Three-Layer Concept

```
┌─────────────────────────────────────────────┐
│         GAME-SPECIFIC LAYER                 │
│  (Hand Cricket engine, UI, rules)           │
├─────────────────────────────────────────────┤
│         SHARED MODULES LAYER                │
│  (Room, Socket, Lobby, UI Kit, Toss)        │
├─────────────────────────────────────────────┤
│         INFRASTRUCTURE LAYER                │
│  (Express, MongoDB, Socket.IO server)       │
└─────────────────────────────────────────────┘
```

### How a New Game Plugs In

1. Add a new folder under `backend/games/<gameName>/`
2. Implement game engine (state machine + rules)
3. Register socket event handlers
4. Add frontend folder under `frontend/src/games/<gameName>/`
5. Build game-specific UI components
6. Register routes in main router

---

## 5. Folder Structure

### Backend

```
backend/
├── app.js                          # Express app config
├── server.js                       # HTTP + Socket.IO bootstrap
├── config/
│   ├── db.js                       # MongoDB connection
│   └── socket.js                   # Socket.IO config
├── modules/                        # 🔁 SHARED across all games
│   ├── room/
│   │   ├── room.controller.js      # REST handlers
│   │   ├── room.service.js         # Business logic
│   │   ├── room.routes.js          # Express routes
│   │   ├── room.socket.js          # Socket event handlers
│   │   └── room.utils.js           # Code generation, etc.
│   ├── socket/
│   │   ├── connection.js           # Connect/disconnect handling
│   │   └── middleware.js           # Socket middleware (auth, etc.)
│   └── lobby/
│       ├── lobby.service.js        # Waiting room logic
│       └── lobby.socket.js
├── games/                          # 🎮 GAME-SPECIFIC
│   └── handCricket/
│       ├── engine.js               # Core game state machine
│       ├── rules.js                # Scoring, OUT, win logic
│       ├── toss.js                 # Toss logic
│       ├── lives.js                # Lives system
│       ├── handCricket.socket.js   # HC-specific socket events
│       └── handCricket.routes.js   # HC-specific REST routes (if any)
├── models/
│   ├── Room.js                     # Generic room model
│   ├── GameState.js                # Live game state
│   └── Match.js                    # Match history
├── middleware/
│   ├── errorHandler.js
│   └── validator.js
├── utils/
│   ├── codeGenerator.js
│   ├── logger.js
│   └── constants.js
├── tests/
│   ├── modules/
│   └── games/
├── .env
└── package.json
```

### Frontend

```
frontend/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx                     # Top-level router
│   ├── index.css
│   ├── styles/
│   │   └── design.css              # Design tokens
│   ├── components/                 # 🔁 SHARED UI components
│   │   ├── common/                 # Button, Modal, Toast, etc.
│   │   ├── layout/                 # Header, Footer, Container
│   │   └── game/                   # Generic game UI (CoinFlip, Timer, etc.)
│   ├── modules/                    # 🔁 SHARED logic modules
│   │   ├── room/
│   │   │   ├── RoomCreate.jsx
│   │   │   ├── RoomJoin.jsx
│   │   │   ├── RoomLobby.jsx
│   │   │   └── useRoom.js          # Custom hook
│   │   ├── socket/
│   │   │   ├── SocketProvider.jsx  # Context provider
│   │   │   └── useSocket.js
│   │   └── toss/
│   │       ├── CoinFlip.jsx
│   │       └── useToss.js
│   ├── games/                      # 🎮 GAME-SPECIFIC
│   │   └── HandCricket/
│   │       ├── index.jsx           # HC entry component
│   │       ├── pages/
│   │       │   ├── HCLanding.jsx
│   │       │   ├── HCHostSetup.jsx
│   │       │   ├── HCJoin.jsx
│   │       │   ├── HCLobby.jsx
│   │       │   ├── HCGame.jsx
│   │       │   └── HCResults.jsx
│   │       ├── components/
│   │       │   ├── HandGesturePicker.jsx
│   │       │   ├── CricketScoreboard.jsx
│   │       │   ├── LivesDisplay.jsx
│   │       │   ├── WicketsDisplay.jsx
│   │       │   ├── OversDisplay.jsx
│   │       │   ├── BallReveal.jsx
│   │       │   ├── InningsBreak.jsx
│   │       │   └── BatBowlIndicator.jsx
│   │       ├── hooks/
│   │       │   ├── useHandCricket.js
│   │       │   └── useGameTimer.js
│   │       ├── context/
│   │       │   └── HCGameContext.jsx
│   │       ├── services/
│   │       │   └── hcApi.js        # Axios calls
│   │       └── utils/
│   │           ├── rules.js        # Client-side helpers
│   │           └── constants.js
│   ├── pages/
│   │   └── Hub.jsx                 # Gaming hub landing (game list)
│   ├── hooks/                      # 🔁 SHARED hooks
│   │   ├── useTimer.js
│   │   ├── useLocalStorage.js
│   │   └── useDisconnect.js
│   ├── context/                    # 🔁 SHARED contexts
│   │   └── AppContext.jsx
│   ├── services/
│   │   ├── api.js                  # Axios base instance
│   │   └── socket.js               # Socket.IO instance
│   ├── utils/
│   │   ├── validators.js
│   │   └── helpers.js
│   └── routes/
│       └── AppRoutes.jsx
├── vercel.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── package.json
```

---

## 6. Database Schema

### `Room` Model (shared across games)

```javascript
{
  _id: ObjectId,
  code: String,              // 6-char alphanumeric, unique, uppercase
  gameType: String,          // 'handCricket' | 'trumpCard' | ...
  hostId: String,            // Socket ID or user ID
  guestId: String,           // null until joined
  status: String,            // 'waiting' | 'active' | 'completed' | 'abandoned'
  settings: Mixed,           // Game-specific settings (mode, overs, wickets)
  createdAt: Date,
  expiresAt: Date,           // 10 min from creation if status='waiting'
  updatedAt: Date
}
```

### `GameState` Model (live state per match)

```javascript
{
  _id: ObjectId,
  roomCode: String,          // Reference to Room.code
  gameType: String,          // 'handCricket'
  phase: String,             // 'toss' | 'innings1' | 'break' | 'innings2' | 'superOver' | 'ended'
  toss: {
    winner: String,          // 'host' | 'guest'
    choice: String           // 'bat' | 'bowl'
  },
  currentInnings: Number,    // 1, 2, or 3 (super over)
  battingPlayer: String,     // 'host' | 'guest'
  bowlingPlayer: String,     // 'host' | 'guest'
  scores: {
    host: { runs: Number, balls: Number, wickets: Number },
    guest: { runs: Number, balls: Number, wickets: Number }
  },
  lives: {
    host: Number,            // Starts at 3, resets per innings
    guest: Number
  },
  target: Number,            // Set after 1st innings
  currentBall: {
    hostPick: Number,        // 1-6 or null
    guestPick: Number,
    hostSubmittedAt: Date,
    guestSubmittedAt: Date,
    deadline: Date           // 7 sec from ball start
  },
  ballHistory: [{            // For replay/stats
    innings: Number,
    ballNumber: Number,
    hostPick: Number,
    guestPick: Number,
    runs: Number,
    isWicket: Boolean,
    notes: String            // 'wide', 'dot', 'miss', etc.
  }],
  winner: String,            // 'host' | 'guest' | 'tie' | null
  endReason: String,         // 'normal' | 'forfeit' | 'livesOut' | 'disconnect' | 'leave'
  createdAt: Date,
  updatedAt: Date
}
```

### `Match` Model (history)

```javascript
{
  _id: ObjectId,
  roomCode: String,
  gameType: String,
  players: { host: String, guest: String },
  finalScores: { host: Number, guest: Number },
  winner: String,
  duration: Number,          // seconds
  settings: Mixed,
  endReason: String,
  playedAt: Date
}
```

---

## 7. Socket.IO Event Catalog

### 🔁 Shared Events (Room module)

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `room:create` | Client → Server | `{ gameType, settings }` | Create new room |
| `room:created` | Server → Client | `{ code, room }` | Room ready |
| `room:join` | Client → Server | `{ code }` | Join room |
| `room:joined` | Server → Both | `{ room, players }` | Guest joined |
| `room:leave` | Client → Server | `{ code }` | Leave (forfeit) |
| `room:left` | Server → Opponent | `{ leaver }` | Notify forfeit |
| `room:expired` | Server → Client | `{ code }` | Room timed out |
| `player:disconnect` | Server → Opponent | `{ playerId, gracePeriod: 30 }` | Disconnect alert |
| `player:reconnect` | Client → Server | `{ code, playerId }` | Resume |
| `player:reconnected` | Server → Opponent | `{ playerId }` | Resumed |

### 🎮 Hand Cricket Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `hc:start` | Server → Both | `{ gameState }` | Match begins |
| `hc:toss:start` | Server → Both | `{}` | Animate coin flip |
| `hc:toss:result` | Server → Both | `{ winner }` | Toss winner |
| `hc:toss:choose` | Client → Server | `{ choice: 'bat' / 'bowl' }` | Winner picks |
| `hc:innings:start` | Server → Both | `{ innings, batsman, bowler }` | Innings begins |
| `hc:ball:start` | Server → Both | `{ ballNumber, deadline }` | Pick window opens |
| `hc:ball:pick` | Client → Server | `{ pick: 1-6 }` | Player picks |
| `hc:ball:reveal` | Server → Both | `{ hostPick, guestPick, runs, isWicket, lives }` | Both picked, reveal |
| `hc:ball:miss` | Server → Both | `{ misser, penalty }` | Timer expired |
| `hc:innings:end` | Server → Both | `{ innings, summary }` | Innings done |
| `hc:break:start` | Server → Both | `{ target }` | Break screen |
| `hc:break:continue` | Client → Server | `{}` | Ready for 2nd innings |
| `hc:superOver:start` | Server → Both | `{}` | Super over begins |
| `hc:match:end` | Server → Both | `{ winner, finalScores, reason }` | Match over |
| `hc:rematch:request` | Client → Server | `{}` | Request rematch |
| `hc:rematch:accept` | Server → Both | `{ newGameState }` | Rematch ready |

---

## 8. REST API Endpoints

### 🔁 Shared

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/rooms` | Create room (returns code) |
| `GET` | `/api/rooms/:code` | Get room info (for join validation) |
| `DELETE` | `/api/rooms/:code` | Delete room (host only) |

### 🎮 Hand Cricket

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/games/hand-cricket/state/:code` | Get current game state (for reconnect) |
| `GET` | `/api/games/hand-cricket/history` | Match history (future feature) |

> Most game flow happens over Socket.IO, REST only for setup/recovery.

---

## 9. Frontend Routes & Pages

```
/                              → Gaming Hub (game selection)
/hand-cricket                  → HC Landing (Host / Join)
/hand-cricket/host             → Host Setup (mode + overs/wickets)
/hand-cricket/join             → Join (enter code)
/hand-cricket/lobby/:code      → Lobby (waiting / connected)
/hand-cricket/play/:code       → Active Game (toss, gameplay, break)
/hand-cricket/results/:code    → Final Results (rematch / exit)
```

---

## 10. Reusable Components Catalog

### 🔁 Shared Common (`src/components/common/`)
- `Button` — variants: primary, secondary, danger, ghost
- `Modal` — base modal wrapper
- `ConfirmDialog` — yes/no confirmation
- `Toast` — notifications
- `Spinner` — loading
- `Input` — text/number with validation
- `Card` — generic container
- `Badge` — status indicators

### 🔁 Shared Layout (`src/components/layout/`)
- `Header` — top nav
- `Footer`
- `PageContainer` — consistent padding/max-width
- `GameContainer` — full-screen game layout

### 🔁 Shared Game UI (`src/components/game/`)
- `CoinFlip` — animated toss (reusable for any game)
- `CountdownTimer` — circular/linear countdown
- `RoomCodeDisplay` — copy-to-clipboard code
- `PlayerCard` — generic player info
- `LivesBar` — generic lives display
- `DisconnectOverlay` — "Opponent disconnected, waiting…"
- `LeaveButton` — with confirmation

### 🎮 Hand Cricket Specific (`src/games/HandCricket/components/`)
- `HandGesturePicker` — 1–6 buttons with hand animations
- `CricketScoreboard` — runs / balls / wickets per player
- `WicketsDisplay` — visual wicket count
- `OversDisplay` — current over / balls bowled
- `BatBowlIndicator` — who's batting/bowling
- `BallReveal` — animation showing both picks
- `InningsBreak` — summary + continue button
- `MatchResultScreen` — winner reveal + scoreboard
- `SuperOverBadge` — visual indicator

---

## 11. State Management Strategy

### React Context Layout
```
AppContext             # Global app state
  ├── SocketProvider   # Socket.IO connection
  ├── RoomProvider     # Current room state
  └── HCGameContext    # Hand cricket game state (game-specific)
```

### Custom Hooks
**Shared:**
- `useSocket()` — socket connection + emit/on helpers
- `useRoom()` — room create/join/leave logic
- `useTimer(seconds)` — countdown
- `useDisconnect()` — reconnect handling
- `useLocalStorage(key)` — persist player ID across reloads

**Hand Cricket:**
- `useHandCricket()` — full game state + actions
- `useGameTimer()` — per-ball 7-sec timer
- `useToss()` — toss flow

### Why Context (Not Redux)?
- Game state is short-lived (1 match)
- No deep prop drilling beyond 2–3 levels
- Less boilerplate for this scale

---

## 12. Game Logic Implementation

### Server-Authoritative Model
**Rule:** Server is the source of truth. Client only sends inputs.

This prevents cheating (no one can fake their pick or score).

### Game State Machine

```
       ┌──────────┐
       │ WAITING  │  (room created, awaiting guest)
       └─────┬────┘
             │ guest joins
             ▼
       ┌──────────┐
       │   TOSS   │  (coin flip → winner picks bat/bowl)
       └─────┬────┘
             ▼
       ┌──────────┐
       │ INNINGS1 │  (ball-by-ball loop)
       └─────┬────┘
             │ all overs / wickets gone
             ▼
       ┌──────────┐
       │  BREAK   │  (summary + continue)
       └─────┬────┘
             ▼
       ┌──────────┐
       │ INNINGS2 │
       └─────┬────┘
             ├─ target crossed → ENDED
             ├─ all out / overs done → check tie
             ▼
       ┌──────────┐
       │   TIE?   │ ─yes→ SUPER OVER (loop until decided)
       └─────┬────┘
             │ no
             ▼
       ┌──────────┐
       │  ENDED   │  (show results)
       └──────────┘
```

### Per-Ball Logic (server-side pseudocode)

```javascript
function onBallStart() {
  setDeadline(now() + 7000)
  broadcast('hc:ball:start', { ballNumber, deadline })
}

function onPickReceived(player, pick) {
  if (now() > deadline) return ignore()
  storePick(player, pick)
  if (bothPicked()) revealBall()
}

function onDeadlineExpired() {
  const { hostPick, guestPick } = currentBall
  if (!hostPick && !guestPick) {
    // both miss → 0 runs, no life lost
    recordBall({ runs: 0, notes: 'both-missed' })
  } else if (!hostPick) {
    handleMiss('host')
  } else if (!guestPick) {
    handleMiss('guest')
  }
  proceedToNextBall()
}

function handleMiss(misser) {
  const isBatsman = (misser === battingPlayer)
  if (isBatsman) {
    if (mode === 'overBased') recordBall({ runs: 0, notes: 'batsman-miss' })
    else loseLife(misser)
  } else {
    // bowler missed → batsman gets 1 run + bowler loses life
    addRuns(battingPlayer, 1)
    loseLife(misser)
  }
  if (lives[misser] <= 0) endMatch({ winner: opponent, reason: 'livesOut' })
}

function revealBall() {
  const { hostPick, guestPick } = currentBall
  if (hostPick === guestPick) {
    // OUT!
    addWicket(battingPlayer)
    if (allWicketsLost()) endInnings()
  } else {
    addRuns(battingPlayer, hostPick + guestPick - min(hostPick, guestPick))
    // Actually: runs = batsman's pick if numbers differ
    // Correct rule: batsman scores their own number
    addRuns(battingPlayer, batsmanPick)
  }
  broadcast('hc:ball:reveal', { ... })
  if (innings === 2 && score > target) endMatch({ winner: battingPlayer })
}
```

> ⚠️ **Note:** Confirm scoring rule — traditional hand cricket: batsman scores **their own pick** when numbers differ. We can adjust if you want a different rule.

### Critical Rules Summary

| Situation | Outcome |
|-----------|---------|
| Different numbers | Batsman scores their pick |
| Same numbers | Batsman OUT |
| Batsman miss (over mode) | 0 runs |
| Batsman miss (wicket mode) | -1 life |
| Bowler miss (any mode) | Batsman +1 run, bowler -1 life |
| Both miss | 0 runs, no penalty |
| Lives = 0 | Instant forfeit |
| Innings change | Lives reset to 3 |
| 2nd innings target crossed | Instant win |
| Tied scores | Super Over (6 balls, 1 wicket each) |

---

## 13. Development Phases

### Phase 1: Foundation (Day 1–2)
- [ ] Initialize repo (frontend + backend)
- [ ] Setup Vite + React + Tailwind
- [ ] Setup Express + Socket.IO + MongoDB connection
- [ ] Configure ESLint, Nodemon, Jest
- [ ] Build base layout (Header, PageContainer)
- [ ] Build common UI kit (Button, Modal, Toast, Input)

### Phase 2: Shared Modules (Day 3–4)
- [ ] Backend: `modules/room` — create, join, expire logic
- [ ] Backend: `modules/socket` — connection middleware
- [ ] Frontend: `SocketProvider` + `useSocket`
- [ ] Frontend: `useRoom` hook + RoomCreate/RoomJoin/RoomLobby components
- [ ] Test: Create room → get code → join → both connected

### Phase 3: Hand Cricket Engine (Day 5–7)
- [ ] Backend: `games/handCricket/engine.js` (state machine)
- [ ] Backend: `rules.js` (scoring, OUT, win conditions)
- [ ] Backend: `lives.js` (anti-AFK system)
- [ ] Backend: `toss.js`
- [ ] Backend: Socket event handlers (`hc:*`)
- [ ] Backend: Jest unit tests for game logic

### Phase 4: Hand Cricket UI (Day 8–10)
- [ ] Pages: HCLanding, HCHostSetup, HCJoin, HCLobby
- [ ] Game UI: CoinFlip animation
- [ ] Game UI: HandGesturePicker with animations
- [ ] Game UI: CricketScoreboard
- [ ] Game UI: BallReveal animation
- [ ] Game UI: LivesDisplay + WicketsDisplay
- [ ] Game UI: InningsBreak + MatchResultScreen

### Phase 5: Edge Cases & Polish (Day 11–12)
- [ ] Disconnect/reconnect (30-sec window)
- [ ] Leave game with confirmation
- [ ] Super Over flow
- [ ] Rematch flow
- [ ] Room expiry handling
- [ ] Toasts for all events
- [ ] Mobile responsive testing
- [ ] Sound effects (optional)

### Phase 6: Hub Integration (Day 13)
- [ ] Build Hub landing page (game cards)
- [ ] Wire navigation
- [ ] Ensure modular structure works (proof: easy to add 2nd game later)

### Phase 7: Testing & Deployment (Day 14)
- [ ] Backend tests (Jest)
- [ ] Manual playthrough — full match end-to-end
- [ ] Mobile playtest
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render/Railway
- [ ] Setup MongoDB Atlas
- [ ] Test in production

---

## 14. Environment Variables

### Backend `.env`
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=http://localhost:5173
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000
ROOM_EXPIRY_MINUTES=10
DISCONNECT_GRACE_SECONDS=30
BALL_TIMEOUT_SECONDS=7
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 15. Deployment Plan

### Frontend (Vercel)
- Push to GitHub
- Connect Vercel to repo
- Set env vars in Vercel dashboard
- `vercel.json` handles SPA routing

### Backend (Render or Railway)
- Both support Node + free tier
- Persistent WebSocket support ✅
- Set env vars in dashboard
- Use MongoDB Atlas (free 512MB tier)

### Domain Setup (Optional)
- Frontend: `gaminghub.yourname.com`
- Backend: `api.gaminghub.yourname.com`

---

## 16. Future Enhancements

- 🧑 **User accounts** (auth, profiles)
- 🏆 **Leaderboard** + ELO rating
- 👥 **Friends system** + matchmaking
- 🎨 **Player avatars** (use existing Cloudinary setup)
- 📊 **Stats dashboard** (career stats)
- 💬 **In-game chat** / emojis
- 🎵 **Sound effects** + music
- 🌙 **Dark/light theme toggle**
- 🌐 **Multi-language** support
- 📱 **PWA** (installable on mobile)
- 🤖 **AI bot opponent** (single-player practice)
- 🎮 **Add more games**: Tic-Tac-Toe, Connect 4, Trump Card

---

## ✅ Final Checklist Before Coding

- [x] Game flow locked
- [x] Tech stack confirmed
- [x] Modular architecture designed
- [x] Folder structure planned
- [x] Database schema designed
- [x] Socket events catalogued
- [x] REST endpoints listed
- [x] Components catalogued
- [x] Development phases planned
- [ ] **Start Phase 1 → Foundation** 🚀

---

> **Built with ❤️ for the Gaming Hub vision.**
> _Next step: Initialize the repo and start Phase 1._
