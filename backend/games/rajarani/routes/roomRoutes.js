const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRoomByCode, getStateByCode } = require('../controllers/roomController');

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/:roomCode/state', getStateByCode);
router.get('/:roomCode', getRoomByCode);

module.exports = router;
