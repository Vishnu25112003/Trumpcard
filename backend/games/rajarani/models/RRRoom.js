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

const rrRoomSchema = new mongoose.Schema(
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
    maxPlayers: { type: Number, min: 4, max: 10, default: 4 },
    players: [playerSchema],
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'abandoned'],
      default: 'waiting',
    },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RRRoom', rrRoomSchema);
