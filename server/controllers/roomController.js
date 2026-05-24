const Room = require('../models/Room');
const { generateRoomCode } = require('../utils/gameHelpers');

const createRoom = async (req, res) => {
  try {
    const { createdBy, totalPlayers, cardsPerPlayer } = req.body;

    if (!createdBy || !totalPlayers || !cardsPerPlayer) {
      return res.status(400).json({
        success: false,
        error: 'createdBy, totalPlayers, and cardsPerPlayer are required',
      });
    }

    let roomCode;
    for (let i = 0; i < 5; i++) {
      const candidate = generateRoomCode();
      const existing = await Room.findOne({ roomCode: candidate });
      if (!existing) {
        roomCode = candidate;
        break;
      }
    }
    if (!roomCode) {
      return res.status(500).json({
        success: false,
        error: 'Could not generate a unique room code. Try again.',
      });
    }

    const room = await Room.create({
      roomCode,
      createdBy: createdBy.trim(),
      totalPlayers: Number(totalPlayers),
      cardsPerPlayer: Number(cardsPerPlayer),
      players: [{ name: createdBy.trim(), socketId: '', isReady: false }],
      status: 'waiting',
    });

    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomCode, playerName } = req.body;

    if (!roomCode || !playerName) {
      return res.status(400).json({
        success: false,
        error: 'roomCode and playerName are required',
      });
    }

    const room = await Room.findOne({ roomCode: roomCode.trim().toUpperCase() });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    if (room.status !== 'waiting') {
      return res.status(400).json({
        success: false,
        error: 'Room is no longer accepting players',
      });
    }
    if (room.players.length >= room.totalPlayers) {
      return res.status(400).json({ success: false, error: 'Room is full' });
    }

    const alreadyIn = room.players.some(
      (p) => p.name.toLowerCase() === playerName.trim().toLowerCase()
    );
    if (alreadyIn) {
      return res.status(400).json({
        success: false,
        error: 'A player with that name is already in this room',
      });
    }

    room.players.push({ name: playerName.trim(), socketId: '', isReady: false });
    await room.save();

    res.json({ success: true, data: room });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const getRoomByCode = async (req, res) => {
  try {
    const room = await Room.findOne({
      roomCode: req.params.roomCode.trim().toUpperCase(),
    });
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { createRoom, joinRoom, getRoomByCode };
