// ── Typing Game — server-side constants ────────────────────────────────────
// Friends mode (Solo mode runs purely on the client and ignores these).

module.exports = {
  // Hard cap on a race (also used to auto-resolve unfinished players as DNF).
  RACE_CAP_MS: 5 * 60 * 1000,

  // 3-2-1-GO before the race begins.
  COUNTDOWN_SECONDS: 3,

  // Coalesce client progress packets per room before broadcasting.
  PROGRESS_BROADCAST_INTERVAL_MS: 100,

  // Room sizing.
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 30,

  // Frontend will switch from track view to leaderboard above this.
  // Kept here so the server can echo it if ever needed.
  VEHICLE_VIEW_MAX: 8,

  DIFFICULTIES: ['easy', 'medium', 'hard'],
  DEFAULT_DIFFICULTY: 'medium',
};
