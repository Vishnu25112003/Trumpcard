const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
  { runs: { type: Number, default: 0 }, balls: { type: Number, default: 0 }, wickets: { type: Number, default: 0 } },
  { _id: false }
);

const hcGameStateSchema = new mongoose.Schema(
  {
    roomCode:    { type: String, required: true, unique: true },
    phase:       { type: String, default: 'toss' },
    toss:        {
      caller: String,
      call: String,
      result: String,
      winner: String,
      choice: String,
    },
    battingRole: String,
    bowlingRole: String,
    scores: {
      host:  { type: scoreSchema, default: () => ({}) },
      guest: { type: scoreSchema, default: () => ({}) },
    },
    lives:       { host: { type: Number, default: 3 }, guest: { type: Number, default: 3 } },
    target:      { type: Number, default: null },
    currentBall: {
      hostPick:   { type: Number, default: null },
      guestPick:  { type: Number, default: null },
      deadline:   { type: Date,   default: null },
      ballNumber: { type: Number, default: 0 },
    },
    currentInnings:   { type: Number, default: 1 },
    inningsSummaries: { type: Array,  default: [] },
    breakReadyCount:  { type: Number, default: 0 },
    soFirstBatRole:   { type: String, default: null },
    soFirstBatRuns:   { type: Number, default: null },
    winner:     { type: String, default: null },
    endReason:  { type: String, default: null },
    settings:   { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HCGameState', hcGameStateSchema);
