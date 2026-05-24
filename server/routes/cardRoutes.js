const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
} = require('../controllers/cardController');

router.get('/', getAllCards);
router.get('/:id', getCardById);
router.post('/', upload.single('image'), createCard);
router.put('/:id', upload.single('image'), updateCard);
router.delete('/:id', deleteCard);

module.exports = router;
