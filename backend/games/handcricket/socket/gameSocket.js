const HCRoom      = require('../models/HCRoom');
const HCGameState = require('../models/HCGameState');
const {
  resolveBall, checkInningsEnd, checkSuperOverEnd,
  getOpponent, safeScore, BALL_TIMEOUT_MS,
} = require('../utils/gameHelpers');

const ballTimers = new Map();

// ─── timer helpers ────────────────────────────────────────────────────────────

function clearBallTimer(roomCode) {
  if (ballTimers.has(roomCode)) {
    clearTimeout(ballTimers.get(roomCode));
    ballTimers.delete(roomCode);
  }
}

function startBallTimer(io, roomCode) {
  clearBallTimer(roomCode);
  ballTimers.set(roomCode, setTimeout(() => onBallTimeout(io, roomCode), BALL_TIMEOUT_MS));
}

// ─── ball flow ────────────────────────────────────────────────────────────────

async function startNextBall(io, roomCode) {
  const gs = await HCGameState.findOne({ roomCode });
  if (!gs || gs.phase === 'ended') return;

  const deadline = new Date(Date.now() + BALL_TIMEOUT_MS);
  gs.currentBall.hostPick  = null;
  gs.currentBall.guestPick = null;
  gs.currentBall.deadline  = deadline;
  gs.markModified('currentBall');
  await gs.save();

  io.to(roomCode).emit('hc:ball:start', {
    ballNumber:  gs.currentBall.ballNumber + 1,
    deadline:    deadline.toISOString(),
    battingRole: gs.battingRole,
    scores:      { host: safeScore(gs.scores.host), guest: safeScore(gs.scores.guest) },
    lives:       { host: gs.lives.host, guest: gs.lives.guest },
  });

  startBallTimer(io, roomCode);
}

async function onBallTimeout(io, roomCode) {
  const gs = await HCGameState.findOne({ roomCode });
  if (!gs || gs.phase === 'ended') return;
  if (!['innings1', 'innings2', 'superOver'].includes(gs.phase)) return;

  const batsmanRole = gs.battingRole;
  const bowlerRole  = gs.bowlingRole;
  const batsmanPick = gs.currentBall[`${batsmanRole}Pick`];
  const bowlerPick  = gs.currentBall[`${bowlerRole}Pick`];

  await processBallResult(io, roomCode, gs, batsmanPick, bowlerPick);
}

async function processBallResult(io, roomCode, gs, batsmanPick, bowlerPick) {
  clearBallTimer(roomCode);

  const batsmanRole  = gs.battingRole;
  const bowlerRole   = gs.bowlingRole;
  const batsmanMissed = batsmanPick == null;
  const bowlerMissed  = bowlerPick  == null;

  let runs     = 0;
  let isWicket = false;
  let notes    = 'normal';
  let lifeEvent = null;

  if (!batsmanMissed && !bowlerMissed) {
    const result = resolveBall(batsmanPick, bowlerPick);
    runs = result.runs; isWicket = result.isWicket;
    notes = isWicket ? 'wicket' : 'run';
  } else if (batsmanMissed && bowlerMissed) {
    notes = 'both-missed';
  } else if (batsmanMissed) {
    if (gs.settings.mode === 'wicketBased') {
      gs.lives[batsmanRole] = Math.max(0, gs.lives[batsmanRole] - 1);
      lifeEvent = { player: batsmanRole, livesLeft: gs.lives[batsmanRole] };
    }
    notes = 'batsman-miss';
  } else {
    runs = 1;
    gs.lives[bowlerRole] = Math.max(0, gs.lives[bowlerRole] - 1);
    lifeEvent = { player: bowlerRole, livesLeft: gs.lives[bowlerRole] };
    notes = 'bowler-miss';
  }

  // Lives forfeit check
  if (lifeEvent && gs.lives[lifeEvent.player] <= 0) {
    gs.markModified('lives');
    await gs.save();
    io.to(roomCode).emit('hc:life:lost', { ...lifeEvent, reason: 'timeout' });
    await endMatch(io, roomCode, gs, getOpponent(lifeEvent.player), 'livesOut');
    return;
  }
  if (lifeEvent) io.to(roomCode).emit('hc:life:lost', { ...lifeEvent, reason: 'timeout' });

  // Apply scores
  gs.scores[batsmanRole].runs    += runs;
  gs.scores[batsmanRole].balls   += 1;
  if (isWicket) gs.scores[batsmanRole].wickets += 1;
  gs.currentBall.ballNumber += 1;

  gs.markModified('scores');
  gs.markModified('lives');
  gs.markModified('currentBall');

  // Check target crossed mid-innings
  if ((gs.phase === 'innings2' || gs.phase === 'superOver') && gs.target != null) {
    if (gs.scores[batsmanRole].runs > gs.target) {
      gs.phase = 'ended'; gs.winner = batsmanRole;
      await gs.save();
      io.to(roomCode).emit('hc:ball:reveal', buildReveal(gs, batsmanPick, bowlerPick, runs, isWicket, notes));
      io.to(roomCode).emit('hc:match:end', { winner: batsmanRole, finalScores: gs.scores, reason: 'target-crossed' });
      return;
    }
  }

  const isSuperOver   = gs.phase === 'superOver';
  const inningsEnded  = isSuperOver
    ? checkSuperOverEnd(gs.scores[batsmanRole])
    : checkInningsEnd(gs);

  await gs.save();
  io.to(roomCode).emit('hc:ball:reveal', buildReveal(gs, batsmanPick, bowlerPick, runs, isWicket, notes));

  if (inningsEnded) {
    setTimeout(() => handleInningsEnd(io, roomCode), 2500);
  } else {
    setTimeout(() => startNextBall(io, roomCode), 2500);
  }
}

function buildReveal(gs, batsmanPick, bowlerPick, runs, isWicket, notes) {
  return {
    batsmanPick, bowlerPick,
    batsmanRole: gs.battingRole,
    bowlerRole:  gs.bowlingRole,
    runs, isWicket, notes,
    scores:  { host: safeScore(gs.scores.host), guest: safeScore(gs.scores.guest) },
    lives:   { host: gs.lives.host, guest: gs.lives.guest },
    ballNumber: gs.currentBall.ballNumber,
  };
}

// ─── innings flow ─────────────────────────────────────────────────────────────

async function handleInningsEnd(io, roomCode) {
  const gs = await HCGameState.findOne({ roomCode });
  if (!gs) return;


  const summary = {
    innings:     gs.currentInnings,
    battingRole: gs.battingRole,
    bowlingRole: gs.bowlingRole,
    scores:      { host: safeScore(gs.scores.host), guest: safeScore(gs.scores.guest) },
    phase:       gs.phase,
  };
  gs.inningsSummaries.push(summary);
  io.to(roomCode).emit('hc:innings:end', summary);

  // ── Super Over handling ──
  if (gs.phase === 'superOver') {
    if (gs.soFirstBatRole == null) {
      // First team just batted → store result, switch, start second team
      gs.soFirstBatRole = gs.battingRole;
      gs.soFirstBatRuns = gs.scores[gs.battingRole].runs;

      const nextBatRole = getOpponent(gs.battingRole);
      gs.battingRole = nextBatRole;
      gs.bowlingRole = getOpponent(nextBatRole);
      gs.scores[nextBatRole] = { runs: 0, balls: 0, wickets: 0 };
      gs.target = gs.soFirstBatRuns;
      gs.lives  = { host: 3, guest: 3 };
      gs.markModified('scores'); gs.markModified('lives');
      gs.markModified('inningsSummaries');
      await gs.save();

      io.to(roomCode).emit('hc:superOver:switch', {
        battingRole: gs.battingRole,
        target: gs.soFirstBatRuns,
        soFirstBatRole: gs.soFirstBatRole,
        soFirstBatRuns: gs.soFirstBatRuns,
      });
      setTimeout(() => startNextBall(io, roomCode), 2500);
    } else {
      // Second team done → compare
      const secondBatRuns = gs.scores[gs.battingRole].runs;
      if (secondBatRuns === gs.soFirstBatRuns) {
        // Tie again → reset super over
        gs.soFirstBatRole = null; gs.soFirstBatRuns = null; gs.target = null;
        gs.scores.host  = { runs: 0, balls: 0, wickets: 0 };
        gs.scores.guest = { runs: 0, balls: 0, wickets: 0 };
        gs.lives = { host: 3, guest: 3 };
        gs.battingRole = getOpponent(gs.battingRole);
        gs.bowlingRole = getOpponent(gs.bowlingRole);
        gs.markModified('scores'); gs.markModified('lives');
        gs.markModified('inningsSummaries');
        await gs.save();
        io.to(roomCode).emit('hc:superOver:start', { battingRole: gs.battingRole });
        setTimeout(() => startNextBall(io, roomCode), 2500);
      } else {
        const winner = secondBatRuns > gs.soFirstBatRuns ? gs.battingRole : gs.soFirstBatRole;
        await endMatch(io, roomCode, gs, winner, 'superOver');
      }
    }
    return;
  }

  // ── Normal innings end ──
  if (gs.currentInnings === 1) {
    const target = gs.scores[gs.battingRole].runs;
    gs.target = target;
    gs.breakReadyCount = 0;
    gs.phase = 'break';
    gs.markModified('inningsSummaries');
    await gs.save();

    io.to(roomCode).emit('hc:break:start', {
      target,
      innings1Summary: summary,
      battingRole: gs.battingRole,
      scores: { host: safeScore(gs.scores.host), guest: safeScore(gs.scores.guest) },
    });
    return;
  }

  if (gs.currentInnings === 2) {
    const hostRuns  = gs.scores.host.runs;
    const guestRuns = gs.scores.guest.runs;

    if (hostRuns === guestRuns) {
      // Tie → super over
      const inns1BatRole = gs.inningsSummaries[0]?.battingRole || 'host';
      const soFirstBat   = getOpponent(inns1BatRole); // loser of innings 1 bats first in SO

      gs.phase = 'superOver'; gs.currentInnings = 3;
      gs.soFirstBatRole = null; gs.soFirstBatRuns = null; gs.target = null;
      gs.scores.host  = { runs: 0, balls: 0, wickets: 0 };
      gs.scores.guest = { runs: 0, balls: 0, wickets: 0 };
      gs.lives = { host: 3, guest: 3 };
      gs.battingRole = soFirstBat;
      gs.bowlingRole = getOpponent(soFirstBat);
      gs.markModified('scores'); gs.markModified('lives');
      gs.markModified('inningsSummaries');
      await gs.save();

      io.to(roomCode).emit('hc:superOver:start', { battingRole: gs.battingRole, bowlingRole: gs.bowlingRole });
      setTimeout(() => startNextBall(io, roomCode), 2500);
    } else {
      const winner = hostRuns > guestRuns ? 'host' : 'guest';
      await endMatch(io, roomCode, gs, winner, 'normal');
    }
  }
}

// ─── match end ────────────────────────────────────────────────────────────────

async function endMatch(io, roomCode, gs, winner, reason) {
  gs.winner = winner; gs.phase = 'ended'; gs.endReason = reason;
  gs.markModified('inningsSummaries');
  await gs.save();

  const room = await HCRoom.findOne({ roomCode });
  if (room) { room.status = 'completed'; await room.save(); }
  clearBallTimer(roomCode);

  io.to(roomCode).emit('hc:match:end', { winner, finalScores: gs.scores, inningsSummaries: gs.inningsSummaries, reason });
  console.log(`[HC] Match ended in ${roomCode} | winner: ${winner} | reason: ${reason}`);
}

// ─── toss ─────────────────────────────────────────────────────────────────────

async function startToss(io, roomCode) {
  await new Promise(r => setTimeout(r, 500));
  const caller = Math.random() < 0.5 ? 'host' : 'guest';
  const gs = await HCGameState.findOne({ roomCode });
  if (!gs) return;
  gs.phase = 'toss';
  gs.toss = { caller, call: null, result: null, winner: null, choice: null };
  gs.battingRole = null;
  gs.bowlingRole = null;
  gs.currentInnings = 1;
  gs.breakReadyCount = 0;
  gs.currentBall = { hostPick: null, guestPick: null, deadline: null, ballNumber: 0 };
  gs.markModified('toss');
  gs.markModified('currentBall');
  await gs.save();

  io.to(roomCode).emit('hc:toss:start', { caller });
}

// ─── main socket setup ────────────────────────────────────────────────────────

const setupSocket = (io) => {
  io.on('connection', (socket) => {

    // ── hc:room:join ─────────────────────────────────────────────────────────
    socket.on('hc:room:join', async ({ roomCode, playerName, role }) => {
      try {
        const rc = roomCode?.toUpperCase();

        // Guard: reject guest if slot already taken by a different socket
        if (role === 'guest') {
          const existing = await HCRoom.findOne({ roomCode: rc });
          if (!existing) { socket.emit('hc:error', 'Room not found'); return; }
          if (['completed', 'abandoned'].includes(existing.status)) { socket.emit('hc:error', 'Room is no longer active'); return; }
          if (existing.guestSocketId && existing.guestSocketId !== socket.id) { socket.emit('hc:error', 'Room is full'); return; }
        }

        // Atomically set socket ID for this role
        const setFields = role === 'host'
          ? { hostSocketId: socket.id, hostName: playerName }
          : { guestSocketId: socket.id, guestName: playerName };

        const room = await HCRoom.findOneAndUpdate(
          { roomCode: rc, status: { $in: ['waiting', 'active'] } },
          { $set: setFields },
          { returnDocument: 'after' }
        );
        if (!room) { socket.emit('hc:error', 'Room not found or closed'); return; }

        socket.join(rc);

        io.to(rc).emit('hc:room:updated', {
          hostName:  room.hostName,
          guestName: room.guestName,
          status:    room.status,
          settings:  room.settings,
        });

        // Atomically claim game start — only one handler succeeds this transition
        if (room.hostSocketId && room.guestSocketId) {
          const claimed = await HCRoom.findOneAndUpdate(
            { roomCode: rc, status: 'waiting', hostSocketId: { $ne: null }, guestSocketId: { $ne: null } },
            { $set: { status: 'active' } },
            { returnDocument: 'after' }
          );

          if (claimed) {
            await HCGameState.deleteOne({ roomCode: rc });
            await HCGameState.create({
              roomCode: rc,
              settings: claimed.settings,
              battingRole: null,
              bowlingRole: null,
            });

            io.to(rc).emit('hc:game:start', {
              hostName:  claimed.hostName,
              guestName: claimed.guestName,
              settings:  claimed.settings,
            });

            startToss(io, rc);
          }
        }
      } catch (err) {
        console.error('[HC] hc:room:join error:', err.message);
        socket.emit('hc:error', 'Failed to join room');
      }
    });

    // ── hc:room:rejoin ───────────────────────────────────────────────────────
    socket.on('hc:room:rejoin', async ({ roomCode, playerName }) => {
      try {
        const room = await HCRoom.findOne({ roomCode: roomCode?.toUpperCase() });
        if (!room) { socket.emit('hc:error', 'Room not found'); return; }

        const rc = roomCode?.toUpperCase();
        socket.join(rc);

        const isHost = room.hostName === playerName;
        if (isHost) room.hostSocketId = socket.id;
        else         room.guestSocketId = socket.id;
        await room.save();

        const gs = await HCGameState.findOne({ roomCode: rc });
        if (gs) {
          socket.emit('hc:state:sync', {
            phase:       gs.phase,
            toss:        gs.toss,
            battingRole: gs.battingRole,
            bowlingRole: gs.bowlingRole,
            scores:      { host: safeScore(gs.scores.host), guest: safeScore(gs.scores.guest) },
            lives:       gs.lives,
            target:      gs.target,
            winner:      gs.winner,
            settings:    gs.settings,
            hostName:    room.hostName,
            guestName:   room.guestName,
            inningsSummaries: gs.inningsSummaries,
            currentInnings: gs.currentInnings,
            currentBall: gs.currentBall,
          });
        }
      } catch (err) {
        console.error('[HC] hc:room:rejoin error:', err.message);
      }
    });

    // ── hc:toss:call ─────────────────────────────────────────────────────────
    socket.on('hc:toss:call', async ({ roomCode, role, call }) => {
      try {
        const rc = roomCode?.toUpperCase();
        if (!['host', 'guest'].includes(role) || !['heads', 'tails'].includes(call)) {
          socket.emit('hc:error', 'Invalid toss call');
          return;
        }

        const gs = await HCGameState.findOne({ roomCode: rc });
        if (!gs || gs.phase !== 'toss') return;
        if (gs.toss?.caller !== role || gs.toss?.call) return;

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const winner = result === call ? role : getOpponent(role);

        gs.toss.call = call;
        gs.toss.result = result;
        gs.toss.winner = winner;
        gs.markModified('toss');
        await gs.save();

        io.to(rc).emit('hc:toss:result', {
          caller: gs.toss.caller,
          call,
          result,
          winner,
        });
      } catch (err) {
        console.error('[HC] hc:toss:call error:', err.message);
      }
    });

    // ── hc:toss:choose ───────────────────────────────────────────────────────
    socket.on('hc:toss:choose', async ({ roomCode, role, choice }) => {
      try {
        const rc = roomCode?.toUpperCase();
        if (!['bat', 'bowl'].includes(choice)) {
          socket.emit('hc:error', 'Invalid toss choice');
          return;
        }

        const gs = await HCGameState.findOne({ roomCode: rc });
        if (!gs || gs.phase !== 'toss') return;
        if (!gs.toss?.winner || gs.toss.winner !== role || gs.toss.choice) return;

        gs.toss.choice  = choice;
        gs.battingRole  = choice === 'bat' ? gs.toss.winner : getOpponent(gs.toss.winner);
        gs.bowlingRole  = getOpponent(gs.battingRole);
        gs.phase        = 'innings1';
        gs.currentInnings = 1;
        gs.lives        = { host: 3, guest: 3 };
        gs.markModified('toss');
        await gs.save();

        io.to(rc).emit('hc:innings:start', {
          innings:     1,
          battingRole: gs.battingRole,
          bowlingRole: gs.bowlingRole,
          settings:    gs.settings,
        });

        setTimeout(() => startNextBall(io, rc), 2000);
      } catch (err) {
        console.error('[HC] hc:toss:choose error:', err.message);
      }
    });

    // ── hc:ball:pick ─────────────────────────────────────────────────────────
    socket.on('hc:ball:pick', async ({ roomCode, pick, role }) => {
      try {
        if (!pick || pick < 1 || pick > 6) { socket.emit('hc:error', 'Invalid pick'); return; }
        const rc  = roomCode?.toUpperCase();
        const now = new Date();

        // Atomic: only set the pick if it hasn't been set yet and deadline hasn't passed
        const updated = await HCGameState.findOneAndUpdate(
          {
            roomCode: rc,
            phase:    { $in: ['innings1', 'innings2', 'superOver'] },
            [`currentBall.${role}Pick`]: null,
            'currentBall.deadline': { $gt: now },
          },
          { $set: { [`currentBall.${role}Pick`]: pick } },
          { returnDocument: 'after' }
        );
        if (!updated) return; // already picked, deadline passed, or game ended

        socket.emit('hc:pick:ack', { pick });

        // Both picked → resolve immediately (no race: findOneAndUpdate returns fresh doc)
        if (updated.currentBall.hostPick != null && updated.currentBall.guestPick != null) {
          clearBallTimer(rc);
          const batsmanPick = updated.currentBall[`${updated.battingRole}Pick`];
          const bowlerPick  = updated.currentBall[`${updated.bowlingRole}Pick`];
          await processBallResult(io, rc, updated, batsmanPick, bowlerPick);
        }
      } catch (err) {
        console.error('[HC] hc:ball:pick error:', err.message);
      }
    });

    // ── hc:break:continue ────────────────────────────────────────────────────
    socket.on('hc:break:continue', async ({ roomCode }) => {
      try {
        // Atomic increment — only the handler that tips the count to 2 starts innings 2
        const gs = await HCGameState.findOneAndUpdate(
          { roomCode, phase: 'break' },
          { $inc: { breakReadyCount: 1 } },
          { returnDocument: 'after' }
        );
        if (!gs) return;

        if (gs.breakReadyCount >= 2) {
          const nextBat  = getOpponent(gs.battingRole);
          const nextBowl = getOpponent(gs.bowlingRole);
          gs.battingRole    = nextBat;
          gs.bowlingRole    = nextBowl;
          gs.phase          = 'innings2';
          gs.currentInnings = 2;
          gs.lives          = { host: 3, guest: 3 };
          gs.currentBall.ballNumber = 0;
          gs.markModified('lives');
          gs.markModified('currentBall');
          await gs.save();

          io.to(roomCode).emit('hc:innings:start', {
            innings:     2,
            battingRole: gs.battingRole,
            bowlingRole: gs.bowlingRole,
            target:      gs.target,
            settings:    gs.settings,
          });
          setTimeout(() => startNextBall(io, roomCode), 2000);
        }
      } catch (err) {
        console.error('[HC] hc:break:continue error:', err.message);
      }
    });

    // ── hc:room:leave ────────────────────────────────────────────────────────
    socket.on('hc:room:leave', async ({ roomCode, role }) => {
      try {
        const gs = await HCGameState.findOne({ roomCode });
        if (gs && !['ended'].includes(gs.phase)) {
          const winner = getOpponent(role);
          await endMatch(io, roomCode, gs, winner, 'forfeit');
        }
        const room = await HCRoom.findOne({ roomCode });
        if (room) { room.status = 'abandoned'; await room.save(); }
        socket.to(roomCode).emit('hc:room:left', { leaver: role });
      } catch (err) {
        console.error('[HC] hc:room:leave error:', err.message);
      }
    });

    // ── hc:rematch:request ───────────────────────────────────────────────────
    socket.on('hc:rematch:request', async ({ roomCode }) => {
      try {
        const room = await HCRoom.findOne({ roomCode });
        if (!room) return;

        room.status = 'waiting';
        await room.save();

        await HCGameState.deleteOne({ roomCode });
        await HCGameState.create({ roomCode, settings: room.settings });

        io.to(roomCode).emit('hc:rematch:ready', {
          hostName:  room.hostName,
          guestName: room.guestName,
          settings:  room.settings,
        });

        startToss(io, roomCode);
      } catch (err) {
        console.error('[HC] hc:rematch:request error:', err.message);
      }
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      try {
        const room = await HCRoom.findOne({
          $or: [{ hostSocketId: socket.id }, { guestSocketId: socket.id }],
          status: 'active',
        });
        if (!room) return;

        const role = room.hostSocketId === socket.id ? 'host' : 'guest';
        const gs   = await HCGameState.findOne({ roomCode: room.roomCode });
        if (gs && gs.phase !== 'ended') {
          const winner = getOpponent(role);
          socket.to(room.roomCode).emit('hc:opponent:disconnected', { role });
          await endMatch(io, room.roomCode, gs, winner, 'disconnect');
        }
      } catch (err) {
        console.error('[HC] disconnect error:', err.message);
      }
    });
  });
};

module.exports = setupSocket;
