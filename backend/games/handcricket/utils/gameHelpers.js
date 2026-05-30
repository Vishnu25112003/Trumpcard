const BALL_TIMEOUT_MS = 7000;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function resolveBall(batsmanPick, bowlerPick) {
  if (batsmanPick === bowlerPick) return { runs: 0, isWicket: true };
  return { runs: batsmanPick, isWicket: false };
}

function checkInningsEnd(gs) {
  const batsman = gs.scores[gs.battingRole];
  const oversOut   = batsman.balls >= gs.settings.overs * 6;
  const wicketsOut = batsman.wickets >= gs.settings.wickets;
  return oversOut || wicketsOut;
}

function checkSuperOverEnd(batsman) {
  return batsman.balls >= 6 || batsman.wickets >= 1;
}

function getOpponent(role) {
  return role === 'host' ? 'guest' : 'host';
}

function safeScore(s) {
  return { runs: s.runs || 0, balls: s.balls || 0, wickets: s.wickets || 0 };
}

module.exports = { generateRoomCode, resolveBall, checkInningsEnd, checkSuperOverEnd, getOpponent, safeScore, BALL_TIMEOUT_MS };
