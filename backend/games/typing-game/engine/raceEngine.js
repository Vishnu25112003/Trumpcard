const paragraphsData = require('../data/paragraphs.json');
const { DIFFICULTIES, DEFAULT_DIFFICULTY } = require('../config');

function pickParagraph(difficulty, excludeId) {
  const pool = paragraphsData[difficulty] || paragraphsData[DEFAULT_DIFFICULTY];
  const candidates = pool.filter((p) => p.id !== excludeId);
  const source = candidates.length ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function normalizeDifficulty(value) {
  return DIFFICULTIES.includes(value) ? value : DEFAULT_DIFFICULTY;
}

function buildResults(gs, { capReached = false } = {}) {
  const results = gs.players.map((p) => {
    const finished = p.finished === true;
    const finishMs = finished && p.finishedAt && gs.startedAt
      ? new Date(p.finishedAt).getTime() - new Date(gs.startedAt).getTime()
      : null;
    return {
      playerId: p.name,
      name: p.name,
      rank: p.rank ?? null,
      finished,
      dnf: !finished,
      progress: p.progress || 0,
      correctChars: p.correctChars || 0,
      totalKeystrokes: p.totalKeystrokes || 0,
      errors: p.errorCount || 0,
      wpm: p.wpm || 0,
      accuracy: p.accuracy || 0,
      finishMs,
    };
  });

  // Finishers first (by rank), DNF after sorted by progress desc.
  results.sort((a, b) => {
    if (a.finished && b.finished) return a.rank - b.rank;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return (b.progress || 0) - (a.progress || 0);
  });

  // Assign final ranks 1-based across the sorted list.
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return { results, capReached };
}

module.exports = { pickParagraph, normalizeDifficulty, buildResults };
