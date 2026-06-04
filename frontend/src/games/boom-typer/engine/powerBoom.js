import { spawnNormalBoom } from './spawner';

export function updatePowerBooms(state, now) {
  state.booms.forEach((boom) => {
    if (boom.type !== 'power' || boom.status === 'blasting' || boom.status === 'dead') return;
    if (now - boom.lastEmitAt < boom.spawnEveryMs) return;

    for (let index = 0; index < boom.wordsPerEmit; index += 1) {
      spawnNormalBoom(state, now, {
        x: clamp(boom.x + (index - (boom.wordsPerEmit - 1) / 2) * 72, 70, state.width - 70),
      });
    }

    boom.lastEmitAt = now;
    boom.emitFlashMs = 260;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
