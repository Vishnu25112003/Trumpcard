const HCRoom = require('../models/HCRoom');
const { generateRoomCode } = require('../utils/gameHelpers');

async function createRoom(req, res) {
  try {
    const { playerName, settings = {} } = req.body;
    if (!playerName) return res.status(400).json({ success: false, error: 'Player name required' });

    let roomCode;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      attempts++;
    } while ((await HCRoom.findOne({ roomCode, status: 'waiting' })) && attempts < 10);

    const room = await HCRoom.create({
      roomCode,
      hostName: playerName.trim(),
      settings: {
        wicketType: settings.wicketType === 'custom' ? 'custom' : 'single',
        wickets:    settings.wicketType === 'custom' ? (Number(settings.wickets) || 3) : 1,
        overs:      Number(settings.overs) || 5,
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({ success: true, roomCode: room.roomCode, settings: room.settings });
  } catch (err) {
    console.error('[HC] createRoom error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create room' });
  }
}

async function getRoomByCode(req, res) {
  try {
    const room = await HCRoom.findOne({ roomCode: req.params.roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

module.exports = { createRoom, getRoomByCode };
