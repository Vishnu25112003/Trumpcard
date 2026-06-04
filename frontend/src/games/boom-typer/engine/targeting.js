export function handleLetterKey(state, char, now) {
  if (state.status !== 'playing') return false;

  const normalized = char.toLowerCase();
  const locked = state.booms.find((boom) => boom.id === state.lockedBoomId && isTargetable(boom));

  if (!locked) {
    state.lockedBoomId = null;
    const target = state.booms
      .filter((boom) => isTargetable(boom) && boom.status === 'falling' && boom.word[0] === normalized)
      .sort((a, b) => b.y - a.y)[0];

    if (!target) return false;

    target.typedIndex = 1;
    target.status = 'locked';
    state.lockedBoomId = target.id;
    fireLetter(state, target, normalized, now);
    completeIfDone(state, target);
    return true;
  }

  const nextChar = locked.word[locked.typedIndex];
  if (normalized !== nextChar) return false;

  locked.typedIndex += 1;
  fireLetter(state, locked, normalized, now);
  completeIfDone(state, locked);
  return true;
}

function isTargetable(boom) {
  return boom.status === 'falling' || boom.status === 'locked';
}

function fireLetter(state, target, char, now) {
  const typedRatio = Math.max(0.2, target.typedIndex / target.word.length);
  state.letters.push({
    id: `letter-${state.nextProjectileId++}`,
    fromX: state.width / 2,
    fromY: state.tankerY - 34,
    toX: target.x - target.radius * 0.42 + target.radius * 0.84 * typedRatio,
    toY: target.y - 4,
    char,
    ageMs: 0,
    createdAt: now,
  });
  state.events.onLetterTyped?.({ boom: target, char });
}

function completeIfDone(state, boom) {
  if (boom.typedIndex < boom.word.length) return;
  boom.status = 'blasting';
  boom.blastAgeMs = 0;
  state.lockedBoomId = null;
  state.boomsClearedThisLevel += 1;
  state.events.onWordCompleted?.(boom);
}
