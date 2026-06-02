export function computeWpm({ correctChars, elapsedMs }) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return Math.max(0, Math.round((correctChars / 5) / minutes));
}

export function computeAccuracy({ correctChars, totalKeystrokes }) {
  if (!totalKeystrokes || totalKeystrokes <= 0) return 0;
  const acc = (correctChars / totalKeystrokes) * 100;
  return Math.max(0, Math.min(100, Math.round(acc)));
}

export function formatTime(ms) {
  if (ms == null) return '—';
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
