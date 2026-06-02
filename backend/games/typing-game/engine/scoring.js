function computeWpm({ correctChars, elapsedMs }) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  const wpm = (correctChars / 5) / minutes;
  return Math.max(0, Math.round(wpm));
}

function computeAccuracy({ correctChars, totalKeystrokes }) {
  if (!totalKeystrokes || totalKeystrokes <= 0) return 0;
  const acc = (correctChars / totalKeystrokes) * 100;
  return Math.max(0, Math.min(100, Math.round(acc)));
}

module.exports = { computeWpm, computeAccuracy };
