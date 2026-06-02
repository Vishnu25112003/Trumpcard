const TGRoom = require('../models/TGRoom');
const TGGameState = require('../models/TGGameState');
const { normalizeDifficulty } = require('../engine/raceEngine');
const { MIN_PLAYERS, MAX_PLAYERS } = require('../config');

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function createRoom(req, res) {
  try {
    const { playerName, maxPlayers = 8, difficulty = 'medium' } = req.body;
    const name = playerName?.trim();
    const size = Number(maxPlayers);

    if (!name) return res.status(400).json({ success: false, error: 'Player name required' });
    if (size < 2 || size > MAX_PLAYERS) {
      return res.status(400).json({ success: false, error: `Max players must be between 2 and ${MAX_PLAYERS}` });
    }

    let roomCode;
    for (let i = 0; i < 10; i++) {
      const candidate = generateRoomCode();
      const existing = await TGRoom.findOne({ roomCode: candidate });
      if (!existing) { roomCode = candidate; break; }
    }
    if (!roomCode) {
      return res.status(500).json({ success: false, error: 'Could not generate a room code' });
    }

    const room = await TGRoom.create({
      roomCode,
      hostName: name,
      maxPlayers: size,
      difficulty: normalizeDifficulty(difficulty),
      players: [{ name, socketId: '', connected: false, isHost: true }],
      status: 'waiting',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.status(201).json({ success: true, room });
  } catch (err) {
    console.error('[TG] createRoom error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create room' });
  }
}

async function joinRoom(req, res) {
  try {
    const { roomCode, playerName } = req.body;
    const code = roomCode?.trim().toUpperCase();
    const name = playerName?.trim();

    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'roomCode and playerName are required' });
    }

    const room = await TGRoom.findOne({ roomCode: code });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    if (room.status !== 'waiting') {
      return res.status(400).json({ success: false, error: 'Room is no longer accepting players' });
    }
    const alreadyIn = room.players.some((p) => p.name.toLowerCase() === name.toLowerCase());
    if (!alreadyIn && room.players.length >= room.maxPlayers) {
      return res.status(400).json({ success: false, error: 'Room is full' });
    }
    if (!alreadyIn) {
      room.players.push({ name, socketId: '', connected: false, isHost: false });
      await room.save();
    }

    res.json({ success: true, room });
  } catch (err) {
    console.error('[TG] joinRoom error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to join room' });
  }
}

async function getRoomByCode(req, res) {
  try {
    const room = await TGRoom.findOne({ roomCode: req.params.roomCode.trim().toUpperCase() });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    res.json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

async function getStateByCode(req, res) {
  try {
    const code = req.params.roomCode.trim().toUpperCase();
    const room = await TGRoom.findOne({ roomCode: code });
    const state = await TGGameState.findOne({ roomCode: code });
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    res.json({ success: true, room, state });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
}

module.exports = { createRoom, joinRoom, getRoomByCode, getStateByCode };
