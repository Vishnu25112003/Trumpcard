const TGRoom = require('../models/TGRoom');
const TGGameState = require('../models/TGGameState');
const {
  pickParagraph,
  normalizeDifficulty,
  buildResults,
} = require('../engine/raceEngine');
const { computeWpm, computeAccuracy } = require('../engine/scoring');
const {
  RACE_CAP_MS,
  COUNTDOWN_SECONDS,
  PROGRESS_BROADCAST_INTERVAL_MS,
} = require('../config');

const capTimers = new Map();        // roomCode -> setTimeout id
const progressTickers = new Map();  // roomCode -> setInterval id
const dirtyRooms = new Set();       // rooms with pending progress changes

function sameName(a, b) {
  return a?.trim().toLowerCase() === b?.trim().toLowerCase();
}

function clearCapTimer(code) {
  if (capTimers.has(code)) {
    clearTimeout(capTimers.get(code));
    capTimers.delete(code);
  }
}

function clearProgressTicker(code) {
  if (progressTickers.has(code)) {
    clearInterval(progressTickers.get(code));
    progressTickers.delete(code);
  }
  dirtyRooms.delete(code);
}

function publicRoom(room) {
  return {
    roomCode: room.roomCode,
    hostName: room.hostName,
    maxPlayers: room.maxPlayers,
    difficulty: room.difficulty,
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
    difficulty: gs.difficulty,
    paragraph: gs.paragraph,
    paragraphId: gs.paragraphId,
    paragraphLength: gs.paragraphLength,
    startedAt: gs.startedAt,
    players: gs.players.map((p) => ({
      playerId: p.name,
      name: p.name,
      progress: p.progress || 0,
      finished: !!p.finished,
      rank: p.rank || null,
      wpm: p.wpm || 0,
      accuracy: p.accuracy || 0,
      connected: !!p.connected,
    })),
    results: gs.results || [],
  };
}

function emitRoomUpdate(io, room) {
  io.to(room.roomCode).emit('typing:lobby_update', publicRoom(room));
}

function startProgressTicker(io, code) {
  clearProgressTicker(code);
  progressTickers.set(code, setInterval(async () => {
    if (!dirtyRooms.has(code)) return;
    dirtyRooms.delete(code);
    try {
      const gs = await TGGameState.findOne({ roomCode: code });
      if (!gs || gs.phase !== 'racing') return;
      io.to(code).emit('typing:progress_update', {
        players: gs.players.map((p) => ({
          playerId: p.name,
          progress: p.progress || 0,
          finished: !!p.finished,
        })),
      });
    } catch (err) {
      console.error('[TG] progress ticker error:', err.message);
    }
  }, PROGRESS_BROADCAST_INTERVAL_MS));
}

async function endRace(io, code, { capReached = false } = {}) {
  clearCapTimer(code);
  clearProgressTicker(code);

  const gs = await TGGameState.findOne({ roomCode: code });
  if (!gs) return;
  if (gs.phase === 'ended') return;

  // Finalize stats for any player who didn't finish.
  const now = Date.now();
  const startMs = gs.startedAt ? new Date(gs.startedAt).getTime() : now;
  const elapsedMs = Math.max(1, now - startMs);
  gs.players.forEach((p) => {
    if (!p.finished) {
      p.wpm = computeWpm({ correctChars: p.correctChars || 0, elapsedMs });
      p.accuracy = computeAccuracy({
        correctChars: p.correctChars || 0,
        totalKeystrokes: p.totalKeystrokes || 0,
      });
    }
  });

  const { results } = buildResults(gs, { capReached });
  gs.phase = 'ended';
  gs.results = results;
  gs.markModified('players');
  gs.markModified('results');
  await gs.save();

  const room = await TGRoom.findOne({ roomCode: code });
  if (room && room.status === 'active') {
    room.status = 'completed';
    await room.save();
  }

  io.to(code).emit('typing:race_over', { results, capReached, state: publicState(gs) });
}

async function startCountdownAndRace(io, code, room) {
  const paragraph = pickParagraph(room.difficulty, room.lastParagraphId);

  await TGGameState.deleteOne({ roomCode: code });
  const gs = await TGGameState.create({
    roomCode: code,
    phase: 'countdown',
    difficulty: room.difficulty,
    paragraph: paragraph.text,
    paragraphId: paragraph.id,
    paragraphLength: paragraph.text.length,
    players: room.players
      .filter((p) => p.connected && p.socketId)
      .map((p) => ({ name: p.name, connected: true })),
  });

  room.status = 'active';
  room.lastParagraphId = paragraph.id;
  await room.save();

  io.to(code).emit('typing:countdown', {
    seconds: COUNTDOWN_SECONDS,
    difficulty: room.difficulty,
    state: publicState(gs),
  });

  setTimeout(async () => {
    const fresh = await TGGameState.findOne({ roomCode: code });
    if (!fresh || fresh.phase !== 'countdown') return;
    fresh.phase = 'racing';
    fresh.startedAt = new Date();
    await fresh.save();

    io.to(code).emit('typing:race_start', {
      paragraph: fresh.paragraph,
      paragraphId: fresh.paragraphId,
      startedAt: fresh.startedAt.toISOString(),
      state: publicState(fresh),
    });

    startProgressTicker(io, code);

    clearCapTimer(code);
    capTimers.set(code, setTimeout(() => {
      endRace(io, code, { capReached: true }).catch((err) =>
        console.error('[TG] cap timeout error:', err.message)
      );
    }, RACE_CAP_MS));
  }, COUNTDOWN_SECONDS * 1000);
}

function setupSocket(io) {
  io.on('connection', (socket) => {
    // ── typing:room:join ─────────────────────────────────────────────────────
    socket.on('typing:room:join', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const name = playerName?.trim();
        const room = await TGRoom.findOne({ roomCode: code });
        if (!room || !name) {
          socket.emit('typing:error', { message: 'Room not found' });
          return;
        }

        const player = room.players.find((p) => sameName(p.name, name));
        if (!player) {
          socket.emit('typing:error', { message: 'You are not registered in this room' });
          return;
        }

        player.socketId = socket.id;
        player.connected = true;
        if (player.isHost) room.hostSocketId = socket.id;
        await room.save();
        socket.join(code);

        emitRoomUpdate(io, room);

        const gs = await TGGameState.findOne({ roomCode: code });
        if (gs) {
          const racePlayer = gs.players.find((p) => sameName(p.name, name));
          if (racePlayer) {
            racePlayer.connected = true;
            gs.markModified('players');
            await gs.save();
          }
          socket.emit('typing:state_sync', { room: publicRoom(room), state: publicState(gs) });
        } else {
          socket.emit('typing:state_sync', { room: publicRoom(room), state: null });
        }
      } catch (err) {
        console.error('[TG] room:join error:', err.message);
        socket.emit('typing:error', { message: 'Failed to join room' });
      }
    });

    // ── typing:set_difficulty (host only) ────────────────────────────────────
    socket.on('typing:set_difficulty', async ({ roomCode, playerName, difficulty }) => {
      try {
        const code = roomCode?.toUpperCase();
        const room = await TGRoom.findOne({ roomCode: code });
        if (!room) return;
        if (!sameName(room.hostName, playerName)) {
          socket.emit('typing:error', { message: 'Only the host can change difficulty' });
          return;
        }
        if (room.status !== 'waiting') return;
        room.difficulty = normalizeDifficulty(difficulty);
        await room.save();
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('[TG] set_difficulty error:', err.message);
      }
    });

    // ── typing:start (host only) ─────────────────────────────────────────────
    socket.on('typing:start', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const room = await TGRoom.findOne({ roomCode: code });
        if (!room) {
          socket.emit('typing:error', { message: 'Room not found' });
          return;
        }
        if (!sameName(room.hostName, playerName) || room.hostSocketId !== socket.id) {
          socket.emit('typing:error', { message: 'Only the host can start' });
          return;
        }
        if (room.status !== 'waiting') {
          socket.emit('typing:error', { message: 'Race already started' });
          return;
        }
        const active = room.players.filter((p) => p.connected && p.socketId);
        if (active.length < 1) {
          socket.emit('typing:error', { message: 'Need at least 1 connected player' });
          return;
        }
        await startCountdownAndRace(io, code, room);
      } catch (err) {
        console.error('[TG] start error:', err.message);
        socket.emit('typing:error', { message: 'Failed to start race' });
      }
    });

    // ── typing:progress ──────────────────────────────────────────────────────
    socket.on('typing:progress', async ({ roomCode, playerName, correctChars, totalKeystrokes, errors }) => {
      try {
        const code = roomCode?.toUpperCase();
        const gs = await TGGameState.findOne({ roomCode: code });
        if (!gs || gs.phase !== 'racing') return;
        const p = gs.players.find((rp) => sameName(rp.name, playerName));
        if (!p || p.finished) return;

        const safeCorrect = Math.max(0, Math.min(gs.paragraphLength, Number(correctChars) || 0));
        const safeKeystrokes = Math.max(safeCorrect, Number(totalKeystrokes) || 0);
        const safeErrors = Math.max(0, Number(errors) || 0);

        p.correctChars = safeCorrect;
        p.totalKeystrokes = safeKeystrokes;
        p.errorCount = safeErrors;
        p.progress = gs.paragraphLength ? safeCorrect / gs.paragraphLength : 0;

        gs.markModified('players');
        await gs.save();
        dirtyRooms.add(code);
      } catch (err) {
        console.error('[TG] progress error:', err.message);
      }
    });

    // ── typing:finished ──────────────────────────────────────────────────────
    socket.on('typing:finished', async ({ roomCode, playerName, correctChars, totalKeystrokes, errors }) => {
      try {
        const code = roomCode?.toUpperCase();
        const gs = await TGGameState.findOne({ roomCode: code });
        if (!gs || gs.phase !== 'racing') return;
        const p = gs.players.find((rp) => sameName(rp.name, playerName));
        if (!p || p.finished) return;

        const finalCorrect = Math.min(gs.paragraphLength, Number(correctChars) || 0);
        if (finalCorrect < gs.paragraphLength) return; // guard: ignore false finish

        const finishedAt = new Date();
        const elapsedMs = Math.max(1, finishedAt.getTime() - new Date(gs.startedAt).getTime());

        p.correctChars = finalCorrect;
        p.totalKeystrokes = Math.max(finalCorrect, Number(totalKeystrokes) || 0);
        p.errors = Math.max(0, Number(errors) || 0);
        p.progress = 1;
        p.finished = true;
        p.finishedAt = finishedAt;
        gs.finishOrderCount = (gs.finishOrderCount || 0) + 1;
        p.rank = gs.finishOrderCount;
        p.wpm = computeWpm({ correctChars: p.correctChars, elapsedMs });
        p.accuracy = computeAccuracy({
          correctChars: p.correctChars,
          totalKeystrokes: p.totalKeystrokes,
        });

        gs.markModified('players');
        await gs.save();

        io.to(code).emit('typing:player_finished', {
          playerId: p.name,
          name: p.name,
          rank: p.rank,
          wpm: p.wpm,
          accuracy: p.accuracy,
          finishMs: elapsedMs,
        });

        // Push a fresh progress snapshot so vehicles snap to 100%.
        io.to(code).emit('typing:progress_update', {
          players: gs.players.map((rp) => ({
            playerId: rp.name,
            progress: rp.progress || 0,
            finished: !!rp.finished,
          })),
        });

        const allDone = gs.players.every((rp) => rp.finished || !rp.connected);
        if (allDone) {
          await endRace(io, code);
        }
      } catch (err) {
        console.error('[TG] finished error:', err.message);
      }
    });

    // ── typing:rematch (host only) ───────────────────────────────────────────
    socket.on('typing:rematch', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const room = await TGRoom.findOne({ roomCode: code });
        if (!room) return;
        if (!sameName(room.hostName, playerName)) {
          socket.emit('typing:error', { message: 'Only the host can rematch' });
          return;
        }
        clearCapTimer(code);
        clearProgressTicker(code);
        await TGGameState.deleteOne({ roomCode: code });
        room.status = 'waiting';
        room.players.forEach((p) => { p.connected = !!p.socketId; });
        await room.save();
        io.to(code).emit('typing:rematch_ready', { room: publicRoom(room) });
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('[TG] rematch error:', err.message);
      }
    });

    // ── typing:leave ─────────────────────────────────────────────────────────
    socket.on('typing:leave', async ({ roomCode, playerName }) => {
      try {
        const code = roomCode?.toUpperCase();
        const room = await TGRoom.findOne({ roomCode: code });
        if (!room) return;
        const player = room.players.find((p) => sameName(p.name, playerName));
        if (player) {
          player.connected = false;
          player.socketId = '';
        }
        if (room.status === 'waiting') {
          room.players = room.players.filter((p) => !sameName(p.name, playerName));
          if (sameName(room.hostName, playerName) || !room.players.length) {
            room.status = 'abandoned';
          }
        }
        await room.save();
        socket.leave(code);
        emitRoomUpdate(io, room);
      } catch (err) {
        console.error('[TG] leave error:', err.message);
      }
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      try {
        const room = await TGRoom.findOne({
          'players.socketId': socket.id,
          status: { $in: ['waiting', 'active'] },
        });
        if (!room) return;
        const player = room.players.find((p) => p.socketId === socket.id);
        if (!player) return;
        player.connected = false;
        player.socketId = '';
        await room.save();
        emitRoomUpdate(io, room);

        const gs = await TGGameState.findOne({ roomCode: room.roomCode });
        if (gs && gs.phase === 'racing') {
          const racePlayer = gs.players.find((rp) => sameName(rp.name, player.name));
          if (racePlayer && !racePlayer.finished) {
            racePlayer.connected = false;
            gs.markModified('players');
            await gs.save();
            io.to(room.roomCode).emit('typing:player_dnf', { playerId: racePlayer.name });
            const allDone = gs.players.every((rp) => rp.finished || !rp.connected);
            if (allDone) {
              await endRace(io, room.roomCode);
            }
          }
        }
      } catch (err) {
        console.error('[TG] disconnect error:', err.message);
      }
    });
  });
}

module.exports = setupSocket;
