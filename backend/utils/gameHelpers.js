const STAT_ORDER = ['power', 'speed', 'intelligence', 'strength', 'defense', 'popularity'];

// ─── array utils ──────────────────────────────────────────────────────────────

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const distributeCards = (cards, numPlayers, cardsPerPlayer) => {
  const shuffled = shuffleArray(cards);
  const hands = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push(shuffled.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer));
  }
  return hands;
};

const pickRandomPlayer = (players) => {
  const active = players.filter((p) => !p.isEliminated);
  return active[Math.floor(Math.random() * active.length)]?.name || '';
};

// Excludes O and 0 to avoid player confusion when typing codes
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ANIME-${suffix}`;
};

// Shuffles eliminatedPlayer's cards and deals them one-by-one to activePlayers.
// Mutates the player objects directly; caller must markModified('players').
const redistributeCards = (eliminatedPlayer, activePlayers) => {
  if (!activePlayers.length || !eliminatedPlayer.cards.length) return;
  const cards = shuffleArray([...eliminatedPlayer.cards]);
  cards.forEach((cardId, i) => {
    const target = activePlayers[i % activePlayers.length];
    target.cards.push(cardId);
    target.cardCount = target.cards.length;
  });
  eliminatedPlayer.cards = [];
  eliminatedPlayer.cardCount = 0;
};

// ─── game logic ───────────────────────────────────────────────────────────────

// Compare topCards on initialStat; auto-break ties by cycling through STAT_ORDER.
// topCards: [{ playerName, card: { stats: {...} } }]
const resolveRound = (topCards, initialStat) => {
  const startIdx = STAT_ORDER.indexOf(initialStat);
  const tieChain = [];

  for (let i = 0; i < STAT_ORDER.length; i++) {
    const stat    = STAT_ORDER[(startIdx + i) % STAT_ORDER.length];
    const maxVal  = Math.max(...topCards.map((tc) => tc.card.stats[stat]));
    const winners = topCards.filter((tc) => tc.card.stats[stat] === maxVal);

    if (winners.length === 1) {
      return { winner: winners[0].playerName, decidingStat: stat, tieChain, isDraw: false };
    }
    tieChain.push(stat);
  }

  return { winner: null, decidingStat: initialStat, tieChain, isDraw: true };
};

// Return the next non-eliminated player after currentPlayerName in turnOrder.
// Correctly handles the case where currentPlayerName was just eliminated —
// it searches the original turnOrder position to find the right successor.
const getNextActiveTurn = (gameState, currentPlayerName) => {
  const { turnOrder, players } = gameState;

  const isActive = (name) => {
    const p = players.find((pl) => pl.name === name);
    return p && !p.isEliminated;
  };

  const startIdx = turnOrder.indexOf(currentPlayerName);

  // If currentPlayerName not in turnOrder at all, return first active player
  if (startIdx === -1) {
    return turnOrder.find(isActive) || null;
  }

  // Cycle forward from the current position until we find an active player
  for (let i = 1; i <= turnOrder.length; i++) {
    const candidate = turnOrder[(startIdx + i) % turnOrder.length];
    if (isActive(candidate)) return candidate;
  }

  return null; // everyone is eliminated
};

module.exports = {
  STAT_ORDER,
  shuffleArray,
  distributeCards,
  pickRandomPlayer,
  generateRoomCode,
  redistributeCards,
  resolveRound,
  getNextActiveTurn,
};
