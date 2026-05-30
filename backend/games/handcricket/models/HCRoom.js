const mongoose = require('mongoose');

const hcRoomSchema = new mongoose.Schema(
  {
    roomCode:      { type: String, required: true, unique: true, uppercase: true, trim: true },
    hostSocketId:  { type: String, default: null },
    guestSocketId: { type: String, default: null },
    hostName:      { type: String, required: true },
    guestName:     { type: String, default: null },
    status:        { type: String, enum: ['waiting', 'active', 'completed', 'abandoned'], default: 'waiting' },
    settings: {
      wicketType: { type: String, enum: ['single', 'custom'], default: 'single' },
      wickets:    { type: Number, default: 1 },
      overs:      { type: Number, default: 5 },
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HCRoom', hcRoomSchema);
