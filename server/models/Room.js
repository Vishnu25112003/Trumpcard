const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    socketId: { type: String, default: '' },
    isReady:  { type: Boolean, default: false },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    createdBy:      { type: String, required: true, trim: true },
    totalPlayers:   { type: Number, required: true, enum: [2, 3, 4] },
    cardsPerPlayer: { type: Number, required: true, min: 1 },
    players:        [playerSchema],
    status: {
      type: String,
      enum: ['waiting', 'playing', 'finished'],
      default: 'waiting',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
