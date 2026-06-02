const roomRoutes = require('./routes/roomRoutes');
const setupSocket = require('./socket/gameSocket');

function registerRoutes(app) {
  app.use('/api/rajarani/rooms', roomRoutes);
}

function registerSocket(io) {
  setupSocket(io);
}

module.exports = { registerRoutes, registerSocket };
