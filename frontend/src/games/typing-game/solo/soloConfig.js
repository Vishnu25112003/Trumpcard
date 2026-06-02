// ── Solo Mode tuning ──────────────────────────────────────────────────────
export const SOLO_CONFIG = {
  MAX_HP: 5,
  PHASE_DURATION_MS: 30_000,

  // Fall speeds in px/sec mapped by tier.
  FALL_SPEED: { LOW: 50, MEDIUM: 85, HIGH: 130 },

  // Per-phase profile.
  PHASES: [
    { tier: 'LOW',    pool: 'easy',   spawnEveryMs: 2000, maxOnScreen: 3 },
    { tier: 'MEDIUM', pool: 'medium', spawnEveryMs: 1500, maxOnScreen: 5 },
    { tier: 'HIGH',   pool: 'hard',   spawnEveryMs: 1100, maxOnScreen: 7 },
    // Phase 3+ — keeps stepping spawn rate down, capped.
    { tier: 'HIGH',   pool: 'hard',   spawnEveryMs: 900,  maxOnScreen: 9 },
  ],

  // Arena layout (Y as a fraction of arena height).
  ARENA: {
    SPAWN_Y_FRAC: 0.05,     // bottle spawn near the top
    BARRIER_Y_FRAC: 0.86,   // barrier line position
    BARRIER_HEIGHT: 26,
  },

  SCORE_PER_LETTER: 10,
  COMBO_BONUS: 5,
};

export function getPhaseConfig(phaseIdx) {
  const phases = SOLO_CONFIG.PHASES;
  const idx = Math.min(phaseIdx, phases.length - 1);
  // Slight progressive speed bump past the last defined phase.
  const base = phases[idx];
  if (phaseIdx <= phases.length - 1) return base;
  const overflow = phaseIdx - (phases.length - 1);
  return {
    ...base,
    spawnEveryMs: Math.max(600, base.spawnEveryMs - overflow * 50),
    maxOnScreen: base.maxOnScreen + overflow,
  };
}
