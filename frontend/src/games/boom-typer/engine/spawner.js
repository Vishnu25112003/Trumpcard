import { TUNING } from '../config/tuning';
import { WORDS } from './wordBank';

let nextId = 1;

export function resetIds() {
  nextId = 1;
}

export function createBoom({ type = 'normal', tier = 0, state, now = 0, x = null }) {
  const word = pickWord(state.booms);
  const radius = type === 'power' ? TUNING.world.powerBoomRadius : TUNING.world.boomRadius;

  return {
    id: `${type}-${nextId++}`,
    word,
    typedIndex: 0,
    x: x ?? pickX(state.booms, radius),
    y: TUNING.world.spawnY - Math.random() * 20,
    speed: state.dropSpeed,
    type,
    tier,
    radius,
    spawnEveryMs: type === 'power' ? TUNING.power.spawnEveryMs : 0,
    wordsPerEmit: type === 'power' ? tier : 0,
    lastEmitAt: now,
    status: 'falling',
    blastAgeMs: 0,
    pulseSeed: Math.random() * 1000,
  };
}

export function spawnNormalBoom(state, now, options = {}) {
  const boom = createBoom({ type: 'normal', state, now, x: options.x });
  state.booms.push(boom);
  state.events.onBoomSpawned?.(boom);
  return boom;
}

export function spawnPowerBoom(state, tier, now) {
  const boom = createBoom({ type: 'power', tier, state, now });
  state.booms.push(boom);
  state.events.onBoomSpawned?.(boom);
  return boom;
}

function pickWord(booms) {
  const liveWords = new Set(booms.filter((boom) => boom.status !== 'dead').map((boom) => boom.word));
  const available = WORDS.filter((word) => !liveWords.has(word));
  const pool = available.length ? available : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickX(booms, radius) {
  const minX = TUNING.world.spawnPaddingX + radius;
  const maxX = TUNING.world.width - TUNING.world.spawnPaddingX - radius;
  let bestX = minX + Math.random() * (maxX - minX);
  let bestDistance = -1;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const x = minX + Math.random() * (maxX - minX);
    const distance = booms.reduce((closest, boom) => {
      if (boom.y > 120 || boom.status === 'dead') return closest;
      return Math.min(closest, Math.abs(boom.x - x));
    }, Infinity);

    if (distance > bestDistance) {
      bestDistance = distance;
      bestX = x;
    }

    if (distance >= TUNING.world.minSpawnGapX) break;
  }

  return bestX;
}
