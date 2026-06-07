// All tunable numbers for the 3D race in one place. Logic never changes when
// these do — adjust by playtesting.

export const RACE_TUNING = {
  // Networking: throttle local progress packets (server also coalesces @100ms).
  PROGRESS_SEND_INTERVAL_MS: 250,

  // World layout (Three.js units). Track runs along +Z, 0 = start, LEN = finish.
  TRACK_LENGTH: 220,
  ROAD_WIDTH: 11,
  LANE_WIDTH: 2.3,

  // Car normalization: GLBs are auto-scaled so their longest footprint matches
  // this, then dropped onto the road (y=0). ROTATION_Y orients the model to
  // face down the track (+Z); tune once per asset pack.
  CAR_TARGET_LENGTH: 2.6,
  CAR_ROTATION_Y: Math.PI, // models in this pack face -Z by default

  // Rival smoothing: per-frame lerp of each car's displayed Z toward its target.
  INTERP_LERP: 0.1,
  // The local player's car tracks char-accurate progress more tightly.
  LOCAL_LERP: 0.25,

  // Chase camera (relative to the local car, which travels +Z).
  CAM_BACK: 6.5,   // how far behind
  CAM_HEIGHT: 3.2, // how high
  CAM_LOOK_AHEAD: 8,
  CAM_LERP: 0.12,
};

// Lane X offset for a car given its index among N players (centered on road).
export function laneX(index, total) {
  const span = (total - 1) / 2;
  return (index - span) * RACE_TUNING.LANE_WIDTH;
}
