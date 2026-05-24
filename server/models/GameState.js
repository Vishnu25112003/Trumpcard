const mongoose = require('mongoose');

const gamePlayerSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    socketId:     { type: String, default: '' },
    cards:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
    cardCount:    { type: Number, default: 0 },
    lives:        { type: Number, default: 3 },
    isEliminated: { type: Boolean, default: false },
  },
  { _id: false }
);

const gameStateSchema = new mongoose.Schema(
  {
    roomCode:    { type: String, required: true, unique: true },
    players:     [gamePlayerSchema],
    currentTurn: { type: String, default: '' },
    turnOrder:   [{ type: String }],
    roundNumber: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['active', 'finished'],
      default: 'active',
    },
    winner: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameState', gameStateSchema);
