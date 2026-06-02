const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { registerSocket: registerTrumpcardSocket } = require('./games/trumpcard');
const { registerSocket: registerHCSocket }        = require('./games/handcricket');
const { registerSocket: registerRRSocket }        = require('./games/rajarani');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,            // reflect request origin — allows any domain
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

registerTrumpcardSocket(io);
registerHCSocket(io);
registerRRSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
