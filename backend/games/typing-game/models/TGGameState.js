const mongoose = require('mongoose');

const racePlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    carId: { type: String, default: '' },            // 3D car for this racer
    progress: { type: Number, default: 0 },          // 0..1
    correctChars: { type: Number, default: 0 },
    totalKeystrokes: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    finished: { type: Boolean, default: false },
    finishedAt: { type: Date, default: null },
    rank: { type: Number, default: null },
    wpm: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    connected: { type: Boolean, default: true },
  },
  { _id: false }
);

const tgGameStateSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true },
    phase: {
      type: String,
      enum: ['lobby', 'countdown', 'racing', 'ended'],
      default: 'lobby',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'large'],
      default: 'medium',
    },
    paragraph: { type: String, default: '' },
    paragraphId: { type: String, default: null },
    paragraphLength: { type: Number, default: 0 },
    timeLimitSec: { type: Number, default: 0 },      // auto-scaled per length
    startedAt: { type: Date, default: null },
    finishOrderCount: { type: Number, default: 0 },
    players: [racePlayerSchema],
    results: { type: Array, default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TGGameState', tgGameStateSchema);
