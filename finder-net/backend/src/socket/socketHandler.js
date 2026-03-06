/**
 * Socket.IO Handler
 * Real-time chat and notifications
 */

const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat.model');

/**
 * Initialize Socket.IO handlers
 */
const socketHandler = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user_${socket.userId}`);

    /**
     * Join a chat room
     */
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Check if user is participant
        const isParticipant = await Chat.isParticipant(chatId, socket.userId);

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`chat_${chatId}`);
        console.log(`User ${socket.userId} joined chat ${chatId}`);

        socket.emit('joined_chat', { chatId });
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    /**
     * Leave a chat room
     */
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    /**
     * Send message (handled via HTTP but can emit real-time update)
     */
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content } = data;

        const chat = await Chat.findById(chatId);

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Check if user is participant
        const isParticipant = await Chat.isParticipant(chatId, socket.userId);

        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Add message
        const message = await Chat.addMessage(chatId, socket.userId, content);

        // Broadcast to chat room
        io.to(`chat_${chatId}`).emit('new_message', {
          chatId,
          message
        });

        console.log(`Message sent in chat ${chatId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping
      });
    });

    /**
     * User disconnection
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

    /**
     * Error handling
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

module.exports = socketHandler;
