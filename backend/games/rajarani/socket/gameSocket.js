const RRRoom = require('../models/RRRoom');
const RRGameState = require('../models/RRGameState');
const { setupMatch } = require('../engine/dealer');
const { ALL_CHARACTERS, characterOf, scoreOf } = require('../engine/characters');
const {
  currentSearcher,
  targetCharacter,
  eligibleTargets,
  lockSeat,
  swapCards,
  buildResults,
} = require('../engine/chain');

const COUNTDOWN_MS = 10_000;
const TURN_TIMEOUT_MS = 10_000;
const turnTimers = new Map();

function samePlayer(a, b) {
  return a?.trim().toLowerCase() === b?.trim().toLowerCase();
}

function clearTurnTimer(roomCode) {
  if (turnTimers.has(roomCode)) {
    clearTimeout(turnTimers.get(roomCode));
    turnTimers.delete(roomCode);
  }
}

function publicRoom(room) {
  return {
    roomCode: room.roomCode,
    hostName: room.hostName,
    maxPlayers: room.maxPlayers,
    status: room.status,
    players: room.players.map((p) => ({
      name: p.name,
      playerId: p.name,
      connected: p.connected,
      isHost: p.isHost,
    })),
  };
}

function publicState(gs) {
  if (!gs) return null;
  return {
    roomCode: gs.roomCode,
    phase: gs.phase,
    chainOrder: gs.chainOrder,
    currentSearchIndex: gs.currentSearchIndex,
    turnDeadline: gs.turnDeadline,
    results: gs.results,
    seats: gs.seats.map((seat) => ({
      playerId: seat.playerId,
      name: seat.name,
      viewed: seat.viewed,
      revealed: seat.revealed,
      lockedScore: seat.lockedScore,
      afk: seat.afk,
      connected: seat.connected,
      card: seat.revealed || gs.phase === 'ended' ? seat.card : null,
    })),
  };
}

function emitRoomUpdate(io, room) {
  io.to(room.roomCode).emit('rajarani:lobbyUpdate', publicRoom(room));
}

async function emitPrivateCards(io, roomCode) {
  const [room, gs] = await Promise.all([
    RRRoom.findOne({ roomCode }),
    RRGameState.findOne({ roomCode }),
  ]);
  if (!room || !gs) return;

  for (const seat of gs.seats) {
    const player = room.players.find((p) => p.name === seat.name);
    if (player?.socketId) {
      io.to(player.socketId).emit('rajarani:yourCard', {
        character: seat.card,
        characterInfo: characterOf(seat.card),
      });
    }
  }
}

async function startTurn(io, roomCode) {
  clearTurnTimer(roomCode);
  const gs = await RRGameState.findOne({ roomCode });
  if (!gs || gs.phase !== 'searching') return;

  const searcher = currentSearcher(gs);
  const target = targetCharacter(gs);
  if (!searcher || !target) return;

  const deadline = new Date(Date.now() + TURN_TIMEOUT_MS);
  gs.turnDeadline = deadline;
  await gs.save();

  io.to(roomCode).emit('rajarani:turn', {
    searcherId: searcher.playerId,
    searcherName: searcher.name,
    targetCharacter: target,
    targetInfo: characterOf(target),
    eligiblePlayerIds: eligibleTargets(gs).map((seat) => seat.playerId),
    deadline: deadline.toISOString(),
    state: publicState(gs),
  });

  turnTimers.set(roomCode, setTimeout(() => onTurnTimeout(io, roomCode), TURN_TIMEOUT_MS));
}

async function endMatch(io, roomCode, gs) {
  clearTurnTimer(roomCode);
  gs.phase = 'ended';
  gs.results = buildResults(gs);
  gs.turnDeadline = null;
  await gs.save();

  const room = await RRRoom.findOne({ roomCode });
  if (room) {
    room.status = 'completed';
    await room.save();
  }

  io.to(roomCode).emit('rajarani:ended', { results: gs.results, state: publicState(gs) });
}

async function processPick(io, roomCode, pickerId, targetPlayerId, source = 'player') {
  clearTurnTimer(roomCode);

  const gs = await RRGameState.findOne({ roomCode });
  if (!gs || gs.phase !== 'searching') return;

  const searcher = currentSearcher(gs);
  const target = targetCharacter(gs);
  if (!searcher || !target) return;
  if (pickerId && searcher.playerId !== pickerId) return;

  const eligible = eligibleTargets(gs);
  const picked = eligible.find((seat) => seat.playerId === targetPlayerId);
  if (!picked) return;

  const searcherChar = gs.chainOrder[gs.currentSearchIndex];
  const correct = picked.card === target;

  io.to(roomCode).emit('rajarani:pickResult', {
    pickedPlayerId: picked.playerId,
    pickedName: picked.name,
    pickedCharacter: picked.card,
    pickedInfo: characterOf(picked.card),
    correct,
    source,
  });

  if (correct) {
    lockSeat(searcher, searcherChar);
    lockSeat(picked, target);
    gs.currentSearchIndex += 1;
    gs.markModified('seats');

    io.to(roomCode).emit('rajarani:locked', {
      locked: [
        { playerId: searcher.playerId, character: searcherChar, score: scoreOf(searcherChar) },
        { playerId: picked.playerId, character: target, score: scoreOf(target) },
      ],
    });

    if (target === 'thief') {
      await endMatch(io, roomCode, gs);
      return;
    }

    await gs.save();
    io.to(roomCode).emit('rajarani:reaction', { type: 'celebrate', playerId: searcher.playerId });
    setTimeout(() => startTurn(io, roomCode), 1200);
    return;
  }

  swapCards(searcher, picked);
  gs.markModified('seats');
  await gs.save();

  io.to(roomCode).emit('rajarani:swap', {
    searcherId: searcher.playerId,
    pickedPlayerId: picked.playerId,
    state: publicState(gs),
  });
  io.to(roomCode).emit('rajarani:reaction', { type: 'caught', playerId: picked.playerId });
  await emitPrivateCards(io, roomCode);
  setTimeout(() => startTurn(io, roomCode), 1200);
}

async function onTurnTimeout(io, roomCode) {
  const gs = await RRGameState.findOne({ roomCode });
  if (!gs || gs.phase !== 'searching') return;

  const searcher = currentSearcher(gs);
  if (!searcher) return;
  searcher.timeoutStrikes += 1;
  if (searcher.timeoutStrikes >= 3) {
    searcher.afk = true;
    io.to(roomCode).emit('rajarani:afk', { playerId: searcher.playerId });
  }
  gs.markModified('seats');
  await gs.save();

  const pool = eligibleTargets(gs);
  if (!pool.length) {
    await endMatch(io, roomCode, gs);
    return;
  }
  const random = pool[Math.floor(Math.random() * pool.length)];
  await processPick(io, roomCode, null, random.playerId, 'timeout');
}

async function revealRajaAndStart(io, roomCode) {
  const gs = await RRGameState.findOne({ roomCode });
  if (!gs || gs.phase !== 'viewing') return;
  const raja = gs.seats.find((seat) => seat.card === 'raja');
  if (!raja) return;
  io.to(roomCode).emit('rajarani:rajaRevealed', {
    playerId: raja.playerId,
    name: raja.name,
    state: publicState(gs),
  });
  gs.phase = 'searching';
  await gs.save();
  setTimeout(() => startTurn(io, roomCode), 900);
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    socket.on('rajarani:room:join', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const name = playerName?.trim();
        const room = await RRRoom.findOne({ roomCode: code });
        if (!room || !name) {
          socket.emit('rajarani:error', 'Room not found');
          return;
        }

        const player = room.players.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!player) {
          socket.emit('rajarani:error', 'You are not registered in this room');
          return;
        }

        player.socketId = socket.id;
        player.connected = true;
        if (player.isHost) room.hostSocketId = socket.id;
        await room.save();
        socket.join(code);

        emitRoomUpdate(io, room);

        const gs = await RRGameState.findOne({ roomCode: code });
        if (gs) {
          const seat = gs.seats.find((s) => s.name === player.name);
          if (seat) {
            seat.playerId = player.name;
            seat.connected = true;
            gs.markModified('seats');
            await gs.save();
            socket.emit('rajarani:yourCard', {
              character: seat.card,
              characterInfo: characterOf(seat.card),
            });
          }
          socket.emit('rajarani:stateSync', { room: publicRoom(room), state: publicState(gs) });
        }
      } catch (err) {
        console.error('[RR] room join error:', err.message);
        socket.emit('rajarani:error', 'Failed to join room');
      }
    });

    socket.on('rajarani:start', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const room = await RRRoom.findOne({ roomCode: code });
        if (!room) {
          socket.emit('rajarani:error', 'Room not found');
          return;
        }
        if (!samePlayer(room.hostName, playerName) || room.hostSocketId !== socket.id) {
          socket.emit('rajarani:error', 'Only the host can start');
          return;
        }
        const activePlayers = room.players.filter((p) => p.connected && p.socketId);
        if (activePlayers.length < 4) {
          socket.emit('rajarani:error', 'Need at least 4 players');
          return;
        }
        if (room.status !== 'waiting') {
          socket.emit('rajarani:error', 'Game already started');
          return;
        }

        const setup = setupMatch(activePlayers);
        await RRGameState.deleteOne({ roomCode: code });
        const gs = await RRGameState.create({
          roomCode: code,
          phase: 'countdown',
          chainOrder: setup.chainOrder,
          seats: setup.seats,
          currentSearchIndex: 0,
        });

        room.status = 'active';
        await room.save();

        io.to(code).emit('rajarani:countdown', {
          characters: setup.characters,
          secondsLeft: COUNTDOWN_MS / 1000,
          state: publicState(gs),
        });

        setTimeout(async () => {
          const fresh = await RRGameState.findOne({ roomCode: code });
          if (!fresh || fresh.phase !== 'countdown') return;
          fresh.phase = 'viewing';
          await fresh.save();
          io.to(code).emit('rajarani:dealt', { state: publicState(fresh) });
          await emitPrivateCards(io, code);
        }, COUNTDOWN_MS);
      } catch (err) {
        console.error('[RR] start error:', err.message);
        socket.emit('rajarani:error', 'Failed to start game');
      }
    });

    socket.on('rajarani:viewCard', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const gs = await RRGameState.findOne({ roomCode: code });
        if (!gs || gs.phase !== 'viewing') return;
        const seat = gs.seats.find((s) => s.name === playerName);
        if (!seat) return;
        seat.viewed = true;
        gs.markModified('seats');
        await gs.save();

        const viewedCount = gs.seats.filter((s) => s.viewed).length;
        io.to(code).emit('rajarani:viewState', {
          viewedCount,
          total: gs.seats.length,
          state: publicState(gs),
        });

        if (viewedCount === gs.seats.length) {
          await revealRajaAndStart(io, code);
        }
      } catch (err) {
        console.error('[RR] viewCard error:', err.message);
      }
    });

    socket.on('rajarani:pick', async ({ roomCode, playerName, targetPlayerId }) => {
      try {
        await processPick(io, roomCode?.toUpperCase(), playerName, targetPlayerId, 'player');
      } catch (err) {
        console.error('[RR] pick error:', err.message);
        socket.emit('rajarani:error', 'Failed to process pick');
      }
    });

    socket.on('rajarani:rematch', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const room = await RRRoom.findOne({ roomCode: code });
        if (!room) return;
        if (!samePlayer(room.hostName, playerName)) {
          socket.emit('rajarani:error', 'Only the host can request rematch');
          return;
        }
        clearTurnTimer(code);
        await RRGameState.deleteOne({ roomCode: code });
        room.status = 'waiting';
        room.players.forEach((p) => { p.connected = !!p.socketId; });
        await room.save();
        io.to(code).emit('rajarani:rematchReady', { room: publicRoom(room) });
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('[RR] rematch error:', err.message);
      }
    });

    socket.on('rajarani:leave', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const room = await RRRoom.findOne({ roomCode: code });
        if (!room) return;
        const player = room.players.find((p) => p.name === playerName);
        if (player) {
          player.connected = false;
          player.socketId = '';
        }
        if (room.status === 'waiting') {
          room.players = room.players.filter((p) => p.name !== playerName);
          if (room.hostName === playerName || !room.players.length) room.status = 'abandoned';
        }
        await room.save();
        socket.leave(code);
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('[RR] leave error:', err.message);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const room = await RRRoom.findOne({ 'players.socketId': socket.id, status: { $in: ['waiting', 'active'] } });
        if (!room) return;
        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) return;
        player.connected = false;
        player.socketId = '';
        await room.save();

        const gs = await RRGameState.findOne({ roomCode: room.roomCode });
        if (gs) {
          const seat = gs.seats.find((s) => s.name === player.name);
          if (seat) {
            seat.connected = false;
            gs.markModified('seats');
            await gs.save();
          }
        }
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('[RR] disconnect error:', err.message);
      }
    });
  });
}

setupSocket.ALL_CHARACTERS = ALL_CHARACTERS;

module.exports = setupSocket;
