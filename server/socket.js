// socket.js
let io = null;
const jwt = require('jsonwebtoken');
const { createClient } = require('redis');
let redisSub = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  io.on('connection', (socket) => {
    // Авторизация по токену
    const token = socket.handshake.auth?.token;
    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        console.log('Socket auth error:', e.message);
      }
    }
    console.log('Socket connected:', socket.id, 'userId:', userId, 'token:', token, 'rooms:', Array.from(socket.rooms));
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
  // Подписка на Redis канал
  redisSub = createClient({ url: 'redis://localhost:6379' });
  redisSub.connect();
  redisSub.subscribe('messages_read', (message) => {
    const data = JSON.parse(message);
    io.emit('messages_read', data);
    console.log('[SOCKET] emit messages_read from Redis', data);
  });
  // Подписка на Redis канал для новых сообщений
  redisSub.subscribe('new_message', (message) => {
    const data = JSON.parse(message);
    io.emit('new_message', data);
    console.log('[SOCKET] emit new_message from Redis', data);
  });
  
  // Подписка на Redis канал для новых уведомлений
  redisSub.subscribe('new_notification', (message) => {
    const data = JSON.parse(message);
    io.emit('new_notification', data);
    console.log('[SOCKET] emit new_notification from Redis', data);
  });
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}

module.exports = { initSocket, getIO }; 