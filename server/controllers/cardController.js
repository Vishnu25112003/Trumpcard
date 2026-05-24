const Card = require('../models/Card');
const cloudinary = require('../config/cloudinary');

const MAX_CARDS = 52;

const getAllCards = async (req, res) => {
  try {
    const cards = await Card.find().sort({ createdAt: -1 });
    res.json({ success: true, count: cards.length, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const createCard = async (req, res) => {
  try {
    const count = await Card.countDocuments();
    if (count >= MAX_CARDS) {
      return res.status(400).json({
        success: false,
        error: `Maximum card limit of ${MAX_CARDS} reached`,
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Card image is required' });
    }

    const { name, category, stats } = req.body;

    let parsedStats = stats;
    if (typeof stats === 'string') {
      try {
        parsedStats = JSON.parse(stats);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid stats format' });
      }
    }

    const card = await Card.create({
      name,
      image: req.file.path,
      category: category || 'anime',
      stats: parsedStats,
    });

    res.status(201).json({ success: true, data: card });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const _deleteCloudinaryImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
  const parts = imageUrl.split('/');
  const uploadIdx = parts.indexOf('upload') + 1;
  if (uploadIdx <= 0) return;
  let sliced = parts.slice(uploadIdx);
  if (/^v\d+$/.test(sliced[0])) sliced = sliced.slice(1);
  const publicId = sliced.join('/').split('.')[0];
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.error('[Cloudinary] Failed to delete image:', e.message);
  }
};

const updateCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });

    if (req.file) {
      await _deleteCloudinaryImage(card.image);
      card.image = req.file.path;
    }

    const { name, category, stats } = req.body;
    if (name) card.name = name;
    if (category) card.category = category;
    if (stats) {
      let parsedStats = stats;
      if (typeof stats === 'string') parsedStats = JSON.parse(stats);
      card.stats = parsedStats;
    }

    const updated = await card.save();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, error: 'Card not found' });
    await _deleteCloudinaryImage(card.image);
    await card.deleteOne();
    res.json({ success: true, message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllCards, getCardById, createCard, updateCard, deleteCard };
