const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Character name is required'],
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      required: [true, 'Card image URL is required'],
    },
    category: {
      type: String,
      default: 'anime',
      trim: true,
    },
    stats: {
      power:        { type: Number, required: true, min: 1, max: 100 },
      speed:        { type: Number, required: true, min: 1, max: 100 },
      intelligence: { type: Number, required: true, min: 1, max: 100 },
      strength:     { type: Number, required: true, min: 1, max: 100 },
      defense:      { type: Number, required: true, min: 1, max: 100 },
      popularity:   { type: Number, required: true, min: 1, max: 100 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Card', cardSchema);
