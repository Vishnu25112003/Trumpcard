require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./shared/config/db');
const { registerRoutes: registerTrumpcardRoutes } = require('./games/trumpcard');
const { registerRoutes: registerHCRoutes }        = require('./games/handcricket');
const { registerRoutes: registerRRRoutes }        = require('./games/rajarani');
const { registerRoutes: registerTGRoutes }        = require('./games/typing-game');

connectDB();

const app = express();

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

registerTrumpcardRoutes(app);
registerHCRoutes(app);
registerRRRoutes(app);
registerTGRoutes(app);

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
