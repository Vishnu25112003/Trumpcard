const express = require('express');
const router = express.Router();
const { createRoom, getRoomByCode } = require('../controllers/roomController');

router.post('/create', createRoom);
router.get('/:roomCode', getRoomByCode);

module.exports = router;
