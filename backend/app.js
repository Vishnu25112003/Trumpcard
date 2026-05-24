require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cardRoutes = require('./routes/cardRoutes');
const roomRoutes = require('./routes/roomRoutes');

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/cards', cardRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trumpcard API is running', timestamp: new Date() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);

  if (err.name === 'CastError') {
    return res.status(404).json({ success: false, error: 'Resource not found (invalid ID)' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ success: false, error: 'Duplicate value — this record already exists' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: messages });
  }

  res.status(err.status || 500).json({ success: false, error: err.message || 'Server error' });
});

module.exports = app;
