const Room = require('../models/Room');
const GameState = require('../models/GameState');
const Card = require('../models/Card');
const {
  STAT_ORDER,
  shuffleArray,
  distributeCards,
  redistributeCards,
  resolveRound,
  getNextActiveTurn,
  computeRankings,
} = require('../utils/gameHelpers');

const NEXT_TURN_DELAY = 4000;  // ms to show round result before next turn
const TURN_TIMEOUT    = 15000; // ms a player has to choose a stat

// Per-room turn timers (in-memory — cleared on server restart)
const turnTimers  = new Map();
const matchTimers = new Map();

function publicPlayers(players) {
  return players.map((p) => ({
    name:         p.name,
    cardCount:    p.cardCount,
    isEliminated: p.isEliminated,
    lives:        p.lives,
  }));
}

async function dealTopCards(io, gameState) {
  for (const p of gameState.players) {
    if (p.isEliminated || !p.cards.length || !p.socketId) continue;
    const topCard = await Card.findById(p.cards[0]).lean();
    if (topCard) io.to(p.socketId).emit('deal_card', { card: topCard });
  }
}

// ─── turn timer ───────────────────────────────────────────────────────────────

function clearTurnTimer(roomCode) {
  if (turnTimers.has(roomCode)) {
    clearTimeout(turnTimers.get(roomCode));
    turnTimers.delete(roomCode);
  }
}

function startTurnTimer(io, roomCode, playerName) {
  clearTurnTimer(roomCode);
  const id = setTimeout(
    () => handleMissedTurn(io, roomCode, playerName, 'timeout'),
    TURN_TIMEOUT
  );
  turnTimers.set(roomCode, id);
}

// ─── match timer ──────────────────────────────────────────────────────────────

function clearMatchTimer(roomCode) {
  if (matchTimers.has(roomCode)) {
    clearTimeout(matchTimers.get(roomCode));
    matchTimers.delete(roomCode);
  }
}

function startMatchTimer(io, roomCode, durationMs) {
  clearMatchTimer(roomCode);
  if (!durationMs || durationMs <= 0) return;
  const id = setTimeout(() => handleMatchExpired(io, roomCode), durationMs);
  matchTimers.set(roomCode, id);
}

async function handleMatchExpired(io, roomCode) {
  try {
    clearTurnTimer(roomCode); // disarm turn timer to prevent double-handling

    const gs = await GameState.findOne({ roomCode });
    if (!gs || gs.status !== 'active') return; // race: natural game-over already happened

    // Mark finished immediately so any concurrent handler bails on its status check
    gs.status = 'finished';
    gs.markModified('status');
    await gs.save();

    // Collect top cards for all non-eliminated active players
    const topCardMap = new Map();
    for (const p of gs.players.filter((pl) => !pl.isEliminated && pl.cards.length)) {
      const card = await Card.findById(p.cards[0]).lean();
      if (card) topCardMap.set(p.name, card);
    }

    const rankings = computeRankings(gs.players, topCardMap);
    const rank1    = rankings.filter((r) => r.rank === 1);
    const winner   = rank1.length === 1 ? rank1[0].playerName : null;

    gs.winner = winner || '';
    await gs.save();

    io.to(roomCode).emit('game_over', {
      winner,
      timeExpired: true,
      rankings,
    });

    console.log(`[Socket] Match time expired in room ${roomCode} | winner: ${winner}`);
  } catch (err) {
    console.error('[Socket] handleMatchExpired error:', err.message);
  }
}

// ─── disconnect / timeout handler ────────────────────────────────────────────

async function handleMissedTurn(io, roomCode, playerName, reason) {
  try {
    const gs = await GameState.findOne({ roomCode });
    if (!gs || gs.status !== 'active') return;
    if (gs.currentTurn !== playerName) return; // stale timer — turn already moved on

    const player = gs.players.find((p) => p.name === playerName);
    if (!player || player.isEliminated) return;

    player.lives = Math.max(0, player.lives - 1);

    io.to(roomCode).emit('life_lost', {
      playerName,
      livesLeft: player.lives,
      reason,
    });

    console.log(`[Socket] ${playerName} lost a life (${player.lives} left) — ${reason} in room ${roomCode}`);

    // Eliminate if out of lives
    if (player.lives <= 0) {
      player.isEliminated = true;
      const activePlayers = gs.players.filter((p) => !p.isEliminated);
      redistributeCards(player, activePlayers);

      const stillActive = gs.players.filter((p) => !p.isEliminated);

      io.to(roomCode).emit('player_eliminated', {
        playerName,
        reason: 'disconnect',
        remainingPlayers: stillActive.map((p) => p.name),
        players: publicPlayers(gs.players),
      });

      console.log(`[Socket] ${playerName} eliminated (no lives left) in room ${roomCode}`);

      if (stillActive.length <= 1) {
        const gameWinner = stillActive[0]?.name || null;
        gs.status  = 'finished';
        gs.winner  = gameWinner || '';
        gs.markModified('players');
        await gs.save();
        clearMatchTimer(roomCode);
        io.to(roomCode).emit('game_over', { winner: gameWinner });
        return;
      }
    }

    // Advance to next player
    const nextPlayer = getNextActiveTurn(gs, playerName);
    gs.currentTurn  = nextPlayer;
    gs.roundNumber += 1;
    gs.markModified('players');
    await gs.save();

    io.to(roomCode).emit('turn_started', {
      currentPlayer: nextPlayer,
      roundNumber:   gs.roundNumber,
      players:       publicPlayers(gs.players),
      skippedPlayer: playerName,
      skipReason:    reason,
    });

    const fresh = await GameState.findOne({ roomCode });
    if (fresh) await dealTopCards(io, fresh);
    startTurnTimer(io, roomCode, nextPlayer);

  } catch (err) {
    console.error('[Socket] handleMissedTurn error:', err.message);
  }
}

// ─── main setup ───────────────────────────────────────────────────────────────

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ── join_room ────────────────────────────────────────────────────────────
    socket.on('join_room', async ({ roomCode, playerName }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room) { socket.emit('error_message', 'Room not found'); return; }

        socket.join(roomCode);

        const player = room.players.find((p) => p.name === playerName);
        if (player) { player.socketId = socket.id; await room.save(); }

        io.to(roomCode).emit('room_updated', {
          players: room.players,
          status:  room.status,
        });
      } catch (err) {
        console.error('[Socket] join_room error:', err.message);
        socket.emit('error_message', 'Failed to join room');
      }
    });

    // ── rejoin_game ──────────────────────────────────────────────────────────
    socket.on('rejoin_game', async ({ roomCode, playerName }) => {
      try {
        socket.join(roomCode);

        const gs = await GameState.findOne({ roomCode });
        if (!gs) { socket.emit('error_message', 'Game not found'); return; }

        const gp = gs.players.find((p) => p.name === playerName);
        if (gp) {
          gp.socketId = socket.id;
          gs.markModified('players');
          await gs.save();
        }

        socket.emit('game_state_sync', {
          currentPlayer:  gs.currentTurn,
          roundNumber:    gs.roundNumber,
          players:        publicPlayers(gs.players),
          status:         gs.status,
          winner:         gs.winner,
          turnTimeout:    TURN_TIMEOUT,
          matchDuration:  gs.matchDuration,
          matchStartedAt: gs.matchStartedAt ? gs.matchStartedAt.toISOString() : null,
        });

        if (gs.status === 'active' && gp && gp.cards.length) {
          const topCard = await Card.findById(gp.cards[0]).lean();
          if (topCard) socket.emit('deal_card', { card: topCard });
        }
      } catch (err) {
        console.error('[Socket] rejoin_game error:', err.message);
        socket.emit('error_message', 'Failed to sync game state');
      }
    });

    // ── start_game ───────────────────────────────────────────────────────────
    socket.on('start_game', async ({ roomCode }) => {
      try {
        const room = await Room.findOne({ roomCode });
        if (!room)                               { socket.emit('error_message', 'Room not found');             return; }
        if (room.players.length < room.totalPlayers) { socket.emit('error_message', 'Not enough players');    return; }
        if (room.status !== 'waiting')           { socket.emit('error_message', 'Game already started');       return; }

        const allCards = await Card.find().lean();
        const needed   = room.totalPlayers * room.cardsPerPlayer;
        if (allCards.length < needed) {
          socket.emit('error_message',
            `Not enough cards. Need ${needed}, have ${allCards.length}. Add more via admin panel.`);
          return;
        }

        const hands       = distributeCards(allCards, room.totalPlayers, room.cardsPerPlayer);
        const turnOrder   = shuffleArray(room.players.map((p) => p.name));
        const firstPlayer = turnOrder[0];

        const gsPlayers = room.players.map((p, i) => ({
          name:         p.name,
          socketId:     p.socketId,
          cards:        hands[i].map((c) => c._id),
          cardCount:    hands[i].length,
          lives:        3,
          isEliminated: false,
        }));

        const matchStartedAt = new Date();

        await GameState.deleteOne({ roomCode });
        const gs = await GameState.create({
          roomCode,
          players:        gsPlayers,
          currentTurn:    firstPlayer,
          turnOrder,
          roundNumber:    1,
          status:         'active',
          matchDuration:  room.matchDuration || 0,
          matchStartedAt,
        });

        room.status = 'playing';
        await room.save();

        io.to(roomCode).emit('game_started', {
          gameState: {
            currentPlayer:  firstPlayer,
            roundNumber:    1,
            turnOrder,
            players:        publicPlayers(gsPlayers),
            turnTimeout:    TURN_TIMEOUT,
            matchDuration:  room.matchDuration || 0,
            matchStartedAt: matchStartedAt.toISOString(),
          },
          firstPlayer,
        });

        await dealTopCards(io, gs);
        startTurnTimer(io, roomCode, firstPlayer);
        startMatchTimer(io, roomCode, (room.matchDuration || 0) * 1000);

        console.log(`[Socket] Game started in room ${roomCode} | first: ${firstPlayer}`);
      } catch (err) {
        console.error('[Socket] start_game error:', err.message);
        socket.emit('error_message', 'Failed to start game');
      }
    });

    // ── choose_stat ──────────────────────────────────────────────────────────
    socket.on('choose_stat', async ({ roomCode, stat, playerName }) => {
      try {
        if (!STAT_ORDER.includes(stat)) { socket.emit('error_message', 'Invalid stat'); return; }

        clearTurnTimer(roomCode); // disarm timeout before any async work

        const gs = await GameState.findOne({ roomCode });
        if (!gs)                          { socket.emit('error_message', 'Game not found');    return; }
        if (gs.currentTurn !== playerName){ socket.emit('error_message', 'Not your turn');      return; }
        if (gs.status !== 'active')       { socket.emit('error_message', 'Game is not active'); return; }

        // Collect top cards
        const topCards = [];
        for (const p of gs.players.filter((p) => !p.isEliminated && p.cards.length)) {
          const card = await Card.findById(p.cards[0]).lean();
          if (card) topCards.push({ playerName: p.name, card, cardId: p.cards[0] });
        }

        const { winner, decidingStat, tieChain, isDraw } = resolveRound(topCards, stat);

        // Remove top card from every active player
        for (const p of gs.players) {
          if (p.isEliminated || !p.cards.length) continue;
          p.cards.splice(0, 1);
          p.cardCount = p.cards.length;
        }

        // Give cards to winner
        if (!isDraw && winner) {
          const wp = gs.players.find((p) => p.name === winner);
          if (wp) {
            topCards.forEach((tc) => wp.cards.push(tc.cardId));
            wp.cardCount = wp.cards.length;
          }
        }

        // Check eliminations
        const justEliminated = [];
        for (const p of gs.players) {
          if (!p.isEliminated && !p.cards.length) {
            p.isEliminated = true;
            justEliminated.push(p.name);
          }
        }

        // Check game over
        const stillActive = gs.players.filter((p) => !p.isEliminated);
        let gameOver = false, gameWinner = null;
        if (stillActive.length <= 1) {
          gameWinner = stillActive[0]?.name || null;
          gs.status  = 'finished';
          gs.winner  = gameWinner || '';
          gameOver   = true;
        }

        // Next player
        let nextPlayer = null;
        if (!gameOver) {
          const currentElim = gs.players.find((p) => p.name === playerName)?.isEliminated;
          if (!isDraw && winner && !gs.players.find((p) => p.name === winner)?.isEliminated) {
            nextPlayer = winner;
          } else if (isDraw && !currentElim) {
            nextPlayer = playerName;
          } else {
            nextPlayer = getNextActiveTurn(gs, playerName);
          }
          gs.currentTurn  = nextPlayer;
          gs.roundNumber += 1;
        }

        gs.markModified('players');
        await gs.save();

        const resultCards = topCards.map((tc) => ({
          playerName:   tc.playerName,
          card:         tc.card,
          statValue:    tc.card.stats[decidingStat],
          chosenStat:   stat,
          decidingStat,
        }));

        io.to(roomCode).emit('round_result', {
          winner:      isDraw ? null : winner,
          isDraw,
          chosenStat:  stat,
          decidingStat,
          tieChain,
          cards:       resultCards,
          eliminated:  justEliminated,
          players:     publicPlayers(gs.players),
          nextPlayer,
          roundNumber: gs.roundNumber,
        });

        if (gameOver) {
          clearMatchTimer(roomCode);
          io.to(roomCode).emit('game_over', { winner: gameWinner });
          return;
        }

        // After result delay: start next turn
        setTimeout(async () => {
          try {
            const fresh = await GameState.findOne({ roomCode });
            if (!fresh || fresh.status !== 'active') return;

            io.to(roomCode).emit('turn_started', {
              currentPlayer: fresh.currentTurn,
              roundNumber:   fresh.roundNumber,
              players:       publicPlayers(fresh.players),
            });

            await dealTopCards(io, fresh);
            startTurnTimer(io, roomCode, fresh.currentTurn);
          } catch (err) {
            console.error('[Socket] turn_started timeout error:', err.message);
          }
        }, NEXT_TURN_DELAY);

      } catch (err) {
        console.error('[Socket] choose_stat error:', err.message);
        socket.emit('error_message', 'Failed to process turn');
      }
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      try {
        // Find any active game this socket belonged to
        const gs = await GameState.findOne({
          'players.socketId': socket.id,
          status: 'active',
        });
        if (!gs) return;

        const player = gs.players.find((p) => p.socketId === socket.id);
        if (!player || player.isEliminated) return;

        // Only penalise when it's their turn (avoids penalising brief background disconnects)
        if (gs.currentTurn === player.name) {
          clearTurnTimer(gs.roomCode);
          await handleMissedTurn(io, gs.roomCode, player.name, 'disconnect');
        }
      } catch (err) {
        console.error('[Socket] disconnect handler error:', err.message);
      }
    });
  });
};

module.exports = setupSocket;
