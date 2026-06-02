const { scoreOf } = require('./characters');

function holderOf(state, charKey) {
  return state.seats.find((seat) => seat.card === charKey);
}

function currentSearcher(state) {
  return holderOf(state, state.chainOrder[state.currentSearchIndex]);
}

function targetCharacter(state) {
  return state.chainOrder[state.currentSearchIndex + 1] || null;
}

function eligibleTargets(state) {
  const searcher = currentSearcher(state);
  if (!searcher) return [];
  return state.seats.filter((seat) =>
    !seat.revealed &&
    !seat.afk &&
    seat.connected !== false &&
    seat.playerId !== searcher.playerId
  );
}

function lockSeat(seat, characterKey) {
  if (!seat.revealed) {
    seat.revealed = true;
    seat.lockedScore = scoreOf(characterKey);
  }
}

function swapCards(a, b) {
  const card = a.card;
  a.card = b.card;
  b.card = card;
}

function buildResults(state) {
  return state.seats
    .map((seat) => ({
      playerId: seat.playerId,
      name: seat.name,
      character: seat.card,
      score: seat.lockedScore ?? scoreOf(seat.card),
      afk: !!seat.afk,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

module.exports = {
  holderOf,
  currentSearcher,
  targetCharacter,
  eligibleTargets,
  lockSeat,
  swapCards,
  buildResults,
};
