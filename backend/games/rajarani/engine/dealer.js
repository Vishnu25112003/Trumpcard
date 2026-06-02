const { selectCharacters } = require('./characters');

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setupMatch(players) {
  const characters = selectCharacters(players.length);
  const dealt = shuffle(characters.map((c) => c.key));

  return {
    chainOrder: characters.map((c) => c.key),
    characters,
    seats: players.map((p, index) => ({
      playerId: p.name,
      name: p.name,
      card: dealt[index],
      viewed: false,
      revealed: false,
      lockedScore: null,
      timeoutStrikes: 0,
      afk: false,
      connected: p.connected !== false,
    })),
  };
}

module.exports = { shuffle, setupMatch };
