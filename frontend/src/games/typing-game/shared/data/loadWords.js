import words from './words.json';

export function getWordPool(difficulty) {
  return words[difficulty] || words.medium;
}

export function pickRandomWord(difficulty, excludeSet) {
  const pool = getWordPool(difficulty);
  const candidates = excludeSet
    ? pool.filter((w) => !excludeSet.has(w))
    : pool;
  const source = candidates.length ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}
