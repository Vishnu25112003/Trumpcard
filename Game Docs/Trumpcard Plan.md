# 🃏 Anime Trump Card Game — Complete Project Plan

---

## 📌 Project Overview

A real-time multiplayer **Anime Trump Card Game** where players compete by comparing character stats. Built with React.js, Node.js, MongoDB, and Socket.io. Players enter their name, create or join a room, and play the game. Admin manages all 52 anime cards via a dedicated panel.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Image Storage | Cloudinary |
| Styling | Tailwind CSS |

---

## 📁 Folder Structure

```
anime-trump-card-game/
│
├── client/                        # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/                # Static images, icons
│   │   ├── components/
│   │   │   ├── Card.jsx           # Single card display component
│   │   │   ├── CardList.jsx       # Player's card stack
│   │   │   ├── StatSelector.jsx   # 6 stat options selector
│   │   │   ├── PlayerInfo.jsx     # Player name & card count
│   │   │   ├── RoomLobby.jsx      # Waiting room component
│   │   │   ├── GameBoard.jsx      # Main game area
│   │   │   ├── RoundResult.jsx    # Round winner display
│   │   │   ├── GameOver.jsx       # Match winner display
│   │   │   └── LivesIndicator.jsx # 3 lives display
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # Name entry page
│   │   │   ├── DashboardPage.jsx  # Create/Join room page
│   │   │   ├── LobbyPage.jsx      # Waiting for players page
│   │   │   ├── GamePage.jsx       # Main game page
│   │   │   └── AdminPage.jsx      # Admin card management
│   │   ├── socket/
│   │   │   └── socket.js          # Socket.io client setup
│   │   ├── context/
│   │   │   └── GameContext.jsx    # Global game state
│   │   ├── utils/
│   │   │   └── helpers.js         # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                        # Node.js Backend
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── cloudinary.js          # Cloudinary config
│   ├── models/
│   │   ├── Card.js                # Card schema
│   │   ├── Room.js                # Room schema
│   │   └── GameState.js           # Game state schema
│   ├── routes/
│   │   ├── cardRoutes.js          # Card CRUD routes
│   │   └── roomRoutes.js          # Room routes
│   ├── controllers/
│   │   ├── cardController.js      # Card logic
│   │   └── roomController.js      # Room logic
│   ├── socket/
│   │   └── gameSocket.js          # All socket.io game events
│   ├── middleware/
│   │   └── upload.js              # Cloudinary image upload
│   ├── utils/
│   │   └── gameHelpers.js         # Shuffle, distribute cards etc.
│   ├── app.js                     # Express app setup
│   ├── server.js                  # Server entry point
│   └── package.json
│
└── README.md
```

---

## 🗄️ MongoDB Schemas

### 1. Card Schema
```js
{
  _id: ObjectId,
  name: String,            // Character name (e.g., "Naruto")
  image: String,           // Cloudinary image URL
  category: String,        // "anime" (only one for now)
  stats: {
    power:         Number, // 1 - 100
    speed:         Number, // 1 - 100
    intelligence:  Number, // 1 - 100
    strength:      Number, // 1 - 100
    defense:       Number, // 1 - 100
    popularity:    Number  // 1 - 100
  },
  createdAt: Date
}
```

### 2. Room Schema
```js
{
  _id: ObjectId,
  roomCode: String,        // Unique code e.g., "ANIME-4X2K"
  createdBy: String,       // Creator's player name
  totalPlayers: Number,    // 2, 3, or 4
  cardsPerPlayer: Number,  // e.g., 10, 13, 17, 20, 26
  players: [
    {
      name: String,        // Player name
      socketId: String,    // Socket connection ID
      isReady: Boolean
    }
  ],
  status: String,          // "waiting" | "playing" | "finished"
  createdAt: Date
}
```

### 3. GameState Schema
```js
{
  _id: ObjectId,
  roomCode: String,
  players: [
    {
      name: String,
      socketId: String,
      cards: [ObjectId],   // Array of card IDs in hand
      cardCount: Number,
      lives: Number,       // Starts at 3
      isEliminated: Boolean
    }
  ],
  currentTurn: String,     // Player name whose turn it is
  turnOrder: [String],     // Ordered player names
  roundNumber: Number,
  status: String,          // "active" | "finished"
  winner: String,          // Winner's player name
  createdAt: Date
}
```

---

## 🔌 API Endpoints

### Card Routes (`/api/cards`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards` | Get all 52 cards |
| GET | `/api/cards/:id` | Get single card |
| POST | `/api/cards` | Create new card (Admin) |
| PUT | `/api/cards/:id` | Update card (Admin) |
| DELETE | `/api/cards/:id` | Delete card (Admin) |

### Room Routes (`/api/rooms`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rooms/create` | Create new room |
| POST | `/api/rooms/join` | Join existing room |
| GET | `/api/rooms/:roomCode` | Get room details |

---

## ⚡ Socket.io Events

### Client → Server (Emit)
| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomCode, playerName }` | Player joins room |
| `start_game` | `{ roomCode }` | Creator starts game |
| `choose_stat` | `{ roomCode, stat, playerName }` | Player picks a stat |
| `player_disconnect` | `{ roomCode, playerName }` | Player disconnects |

### Server → Client (Broadcast)
| Event | Payload | Description |
|-------|---------|-------------|
| `room_updated` | `{ players, status }` | Room player list updated |
| `game_started` | `{ gameState, firstPlayer }` | Game begins |
| `turn_started` | `{ currentPlayer, cards }` | New turn begins |
| `round_result` | `{ winner, cards, updatedState }` | Round result |
| `tie_detected` | `{ tiedStat, nextStat }` | Tie, moving to next stat |
| `player_eliminated` | `{ playerName, remainingPlayers }` | Player knocked out |
| `life_lost` | `{ playerName, livesLeft }` | Player lost a life |
| `game_over` | `{ winner }` | Match finished |

---

## 🎮 Complete Game Flow

### Step 1 — Name Entry
- User visits website
- Enters their name
- Name stored in localStorage
- Redirected to Dashboard

### Step 2 — Dashboard
- See two options: **Create Room** or **Join Room**

### Step 3 — Create Room
- Select number of players (2, 3, or 4)
- Select cards per player (must be valid count)
- Room created in MongoDB
- Unique Room Code generated (e.g., `ANIME-4X2K`)
- Creator enters Lobby and waits

### Step 4 — Join Room
- Enter Room Code
- MongoDB verifies room exists and is not full
- Player joins Lobby

### Step 5 — Lobby
- All joined players visible
- Creator sees **Start Game** button
- Game starts only when all required players have joined

### Step 6 — Game Initialization
- 52 Anime cards fetched from MongoDB
- Cards randomly shuffled
- Distributed equally to all players (based on cardsPerPlayer setting)
- Random player selected to go first
- All players notified: **"Player X goes first!"**

### Step 7 — Turn Flow
```
Active player's turn highlighted
        ↓
Active player sees their TOP card
        ↓
Active player chooses 1 stat from:
  [ Power | Speed | Intelligence | Strength | Defense | Popularity ]
        ↓
All players' top card same stat compared
        ↓
Results displayed to everyone
        ↓
Highest value = WINNER of round
        ↓
Winner collects ALL other players' top cards
        ↓
Winner starts next turn
```

### Step 8 — Tie Handling
```
Same stat, same value detected
        ↓
Auto compare next stat in order:
Power → Speed → Intelligence → Strength → Defense → Popularity
        ↓
All 6 stats are tied?
        ↓
Round = DRAW, nobody wins cards
Same player starts next round
```

### Step 9 — Player Elimination
```
Player reaches 0 cards
        ↓
Player is ELIMINATED ❌
        ↓
2 Players  → Game ends immediately, opponent WINS
3-4 Players → Eliminated player exits, others continue
```

### Step 10 — Disconnect Handling (3 Lives System)
```
Player disconnects or times out
        ↓
Loses 1 life ⚠️  (2 lives remaining)
Miss again → Loses 2nd life ⚠️ (1 life remaining)
Miss again → AUTO ELIMINATED ❌
        ↓
Their remaining cards distributed randomly
to all active players
        ↓
Game continues with remaining players
```

### Step 11 — Game Over
```
One player collects ALL cards
        ↓
WINNER declared! 🏆
        ↓
Game result saved to MongoDB
        ↓
All players see winner screen
        ↓
Option to Return to Dashboard
```

---

## 🔐 Admin Panel

### Access
- Navigate to `/admin` in browser URL
- No login required
- Direct access to admin panel

### Features
| Feature | Description |
|---------|-------------|
| View all cards | See all 52 anime cards in a grid |
| Add new card | Upload image + enter 6 stats + character name |
| Edit card | Update any card's stats or image |
| Delete card | Remove a card from database |
| Card count display | Shows how many cards exist (max 52) |

### Admin Card Form Fields
```
Character Name  : Text input
Character Image : Image upload (stored on Cloudinary)
Power           : Number input (1 - 100)
Speed           : Number input (1 - 100)
Intelligence    : Number input (1 - 100)
Strength        : Number input (1 - 100)
Defense         : Number input (1 - 100)
Popularity      : Number input (1 - 100)
```

---

## 🃏 Card Rules

| Rule | Detail |
|------|--------|
| Total cards | 52 per category |
| Category | Anime only (for now) |
| Stats | Power, Speed, Intelligence, Strength, Defense, Popularity |
| Stat range | 1 to 100 |
| Max players | 4 |
| Card distribution | Pure random, no bias |
| Unbalanced counts | Allowed (e.g., 17 cards each) |

---

## ✅ Complete Feature Checklist

### User Features
- [x] Name entry (no login required)
- [x] Create room with player count & card count
- [x] Join room via Room Code
- [x] Lobby waiting room with player list
- [x] Real-time gameplay via Socket.io
- [x] View top card during turn
- [x] Choose stat to compete
- [x] See round results in real-time
- [x] Card count updates live
- [x] Player elimination in multiplayer
- [x] 3 lives disconnect protection
- [x] Winner announcement screen

### Admin Features
- [x] Access via /admin route
- [x] Add anime cards with image upload
- [x] Enter 6 stats per card
- [x] Edit existing cards
- [x] Delete cards
- [x] View all cards in grid

### Game Logic
- [x] Random card shuffle
- [x] Equal card distribution
- [x] Random first player selection
- [x] Turn-based system
- [x] Stat comparison engine
- [x] Tie breaker (next stat auto compare)
- [x] All 6 stats tie = round draw
- [x] Winner collects loser cards
- [x] Player eliminated at 0 cards
- [x] Last player with all cards wins
- [x] No bot players

---

## 🚀 Development Phases

### Phase 1 — Backend Setup
- Initialize Node.js + Express project
- Connect MongoDB
- Configure Cloudinary
- Create Card, Room, GameState models
- Build Card CRUD API routes
- Build Room creation/joining routes

### Phase 2 — Admin Panel
- Build /admin page in React
- Card grid view
- Add card form with image upload
- Edit and delete card functionality
- Test all 52 cards can be added

### Phase 3 — Frontend Core
- Name entry page
- Dashboard (Create/Join room)
- Room creation with player & card count selector
- Join room with Room Code input
- Lobby page with player list

### Phase 4 — Real-time Game (Socket.io)
- Setup Socket.io server and client
- Implement all socket events
- Game initialization logic
- Turn-based flow
- Stat comparison engine
- Tie breaker logic
- Card transfer on win
- Player elimination

### Phase 5 — Disconnect & Lives System
- Detect player disconnect
- 3 lives countdown
- Auto elimination on 3rd miss
- Redistribute disconnected player's cards

### Phase 6 — UI/UX Polish
- Card animations
- Turn highlight effects
- Round result display
- Win/lose screens
- Mobile responsive design

### Phase 7 — Testing
- Test 2 player game
- Test 3 player game
- Test 4 player game
- Test disconnect scenarios
- Test tie scenarios
- Test admin panel
- Cross-browser testing

---

## 🌍 Environment Variables

```env
# Server
PORT=5000
MONGODB_URI=mongodb+srv://...
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📝 Important Notes for Development

1. **No authentication required** — only player name stored in localStorage
2. **Admin panel has no protection** — access via /admin URL directly
3. **Socket.io rooms** match MongoDB room codes exactly
4. **Card images** stored on Cloudinary, only URL saved in MongoDB
5. **Unbalanced card counts are allowed** — no validation needed for equal split
6. **No leaderboard** in this version
7. **No token/blockchain** in this version
8. **Maximum 52 cards** in database at any time
9. **Only Anime category** for now
10. **3 lives system** applies to disconnect/timeout only, not game losses

---

*This plan covers the complete MongoDB-based version of the Anime Trump Card Game. Blockchain integration will be handled in a separate phase.*
