const cardRoutes = require('./routes/cardRoutes');
const roomRoutes = require('./routes/roomRoutes');
const { setupSocket } = require('./socket/gameSocket');

function registerRoutes(app) {
  app.use('/api/cards', cardRoutes);
  app.use('/api/rooms', roomRoutes);
}

function registerSocket(io) {
  setupSocket(io);
}

module.exports = { registerRoutes, registerSocket };
