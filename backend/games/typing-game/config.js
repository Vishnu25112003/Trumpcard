// ── Typing Game / Boom Typer — server-side constants ───────────────────────
// Friends mode powers BOTH the legacy 2D typing race (dormant) and the new
// Boom Typer 3D car race. Solo mode runs purely on the client.

module.exports = {
  // Absolute safety ceiling for a race. The real per-match limit is derived
  // from paragraph length (see engine/raceEngine.computeTimeLimitSec); this is
  // only a backstop so a room can never live forever.
  RACE_CAP_MS: 10 * 60 * 1000,

  // 3-2-1-GO before the race begins.
  COUNTDOWN_SECONDS: 3,

  // Coalesce client progress packets per room before broadcasting.
  PROGRESS_BROADCAST_INTERVAL_MS: 100,

  // Room sizing. Capped to the car-pool size so every racer gets a distinct car.
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 12,

  // Frontend (legacy 2D race) switches from track view to leaderboard above this.
  VEHICLE_VIEW_MAX: 8,

  // Modes are LENGTH tiers (vocabulary stays normal across all three):
  //   easy = short paragraph, medium = medium, large = long.
  DIFFICULTIES: ['easy', 'medium', 'large'],
  DEFAULT_DIFFICULTY: 'medium',

  // Auto-scaled time limit: ceil((wordCount / ASSUMED_MIN_WPM) * 60 * BUFFER).
  ASSUMED_MIN_WPM: 20,
  TIME_BUFFER: 1.2,
  MIN_TIME_LIMIT_SEC: 30,

  // Car pool for the 3D race — one distinct GLB per player (matches the files
  // in frontend/public/models/cars/). Ordered so early joiners get the
  // most visually distinct cars.
  CAR_POOL: [
    'italia', 'coupe', 'fenyr', 'ghini', 'lamb', 'rally',
    'kamaro', 'jeep', 'van', 'mobil', 'police', 'armor',
  ],
};
