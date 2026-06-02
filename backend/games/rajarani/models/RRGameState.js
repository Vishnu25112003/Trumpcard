const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    playerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    card: { type: String, required: true },
    viewed: { type: Boolean, default: false },
    revealed: { type: Boolean, default: false },
    lockedScore: { type: Number, default: null },
    timeoutStrikes: { type: Number, default: 0 },
    afk: { type: Boolean, default: false },
    connected: { type: Boolean, default: true },
  },
  { _id: false }
);

const rrGameStateSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true },
    phase: {
      type: String,
      enum: ['lobby', 'countdown', 'viewing', 'searching', 'ended'],
      default: 'lobby',
    },
    chainOrder: [{ type: String }],
    seats: [seatSchema],
    currentSearchIndex: { type: Number, default: 0 },
    turnDeadline: { type: Date, default: null },
    results: { type: Array, default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RRGameState', rrGameStateSchema);
