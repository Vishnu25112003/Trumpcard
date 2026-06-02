const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    socketId: { type: String, default: '' },
    connected: { type: Boolean, default: false },
    isHost: { type: Boolean, default: false },
  },
  { _id: false }
);

const tgRoomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      required: true,
    },
    hostName: { type: String, required: true, trim: true },
    hostSocketId: { type: String, default: '' },
    maxPlayers: { type: Number, min: 2, max: 30, default: 8 },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    players: [playerSchema],
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'abandoned'],
      default: 'waiting',
    },
    lastParagraphId: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TGRoom', tgRoomSchema);
