export const TUNING = {
  world: {
    width: 960,
    height: 640,
    bottomLine: 574,
    tankerY: 596,
    dropSpeed: 34,
    boomRadius: 33,
    powerBoomRadius: 41,
    spawnPaddingX: 72,
    spawnY: -46,
    minSpawnGapX: 76,
  },
  loop: {
    maxDtMs: 50,
  },
  spawn: {
    firstSpawnDelayMs: 450,
    powerTriggerRatio: 0.5,
    powerSpawnGapMs: 900,
  },
  projectile: {
    ttlMs: 280,
  },
  explosion: {
    ttlMs: 380,
    particles: 18,
  },
  levelBannerMs: 1200,
  power: {
    spawnEveryMs: 5000,
  },
};

const LEVEL_TABLE = [
  { goal: 10, maxBooms: 3, spawnIntervalMs: 2500, powerTiers: [] },
  { goal: 12, maxBooms: 4, spawnIntervalMs: 2300, powerTiers: [] },
  { goal: 14, maxBooms: 5, spawnIntervalMs: 2100, powerTiers: [1] },
  { goal: 16, maxBooms: 6, spawnIntervalMs: 1900, powerTiers: [2, 2] },
  { goal: 18, maxBooms: 7, spawnIntervalMs: 1700, powerTiers: [2, 2, 3] },
];

export function getLevelConfig(level) {
  if (level <= LEVEL_TABLE.length) {
    return LEVEL_TABLE[level - 1];
  }

  const extra = level - LEVEL_TABLE.length;
  const powerCount = 3 + Math.floor(extra / 2);
  const topTier = 3 + extra;
  const powerTiers = Array.from({ length: powerCount }, (_, index) => {
    const distanceFromTop = powerCount - 1 - index;
    return Math.max(1, topTier - distanceFromTop);
  });

  return {
    goal: 18 + extra * 2,
    maxBooms: 7 + Math.ceil(extra / 2),
    spawnIntervalMs: Math.max(900, 1700 - extra * 150),
    powerTiers,
  };
}
