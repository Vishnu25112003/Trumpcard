import { getLevelConfig } from '../config/tuning';

export function buildLevelState(level) {
  const config = getLevelConfig(level);

  return {
    level,
    boomsClearedThisLevel: 0,
    boomsGoalThisLevel: config.goal,
    spawnIntervalMs: config.spawnIntervalMs,
    maxBoomsOnScreen: config.maxBooms,
    pendingPowerTiers: [...config.powerTiers],
    powerQueued: false,
    nextPowerSpawnAt: 0,
  };
}
