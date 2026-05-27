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
      mode:    { type: String, enum: ['overBased', 'wicketBased'], default: 'overBased' },
      overs:   { type: Number, default: 5 },
      wickets: { type: Number, default: 3 },
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HCRoom', hcRoomSchema);
