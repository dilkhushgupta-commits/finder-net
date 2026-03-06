/**
 * Chat Controller
 * Handles real-time chat between users
 */

const Chat = require('../models/Chat.model');
const Item = require('../models/Item.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get all chats for current user
 * @route GET /api/chat
 */
const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.findByUser(req.user.userId);

    res.status(200).json({
      status: 'success',
      data: { chats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single chat by ID
 * @route GET /api/chat/:id
 */
const getChatById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findByIdWithDetails(id);

    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    // Check if user is participant
    const isParticipant = await Chat.isParticipant(id, req.user.userId);

    if (!isParticipant) {
      throw new ApiError(403, 'Access denied');
    }

    // Mark messages as read
    await Chat.markAsRead(id, req.user.userId);

    res.status(200).json({
      status: 'success',
      data: { chat }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or get existing chat
 * @route POST /api/chat
 */
const createChat = async (req, res, next) => {
  try {
    const { participantId, itemId } = req.body;

    if (!participantId || !itemId) {
      throw new ApiError(400, 'Participant ID and Item ID are required');
    }

    // Check if chat already exists
    let chat = await Chat.findExisting(req.user.userId, participantId, itemId);

    if (chat) {
      // Return existing chat with details
      chat = await Chat.findByIdWithDetails(chat.id);
      return res.status(200).json({
        status: 'success',
        data: { chat }
      });
    }

    // Verify item exists
    const item = await Item.findById(itemId);
    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    // Verify participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      throw new ApiError(404, 'User not found');
    }

    // Create new chat
    const newChat = await Chat.create({
      participants: [req.user.userId, participantId],
      relatedItem: itemId
    });

    const fullChat = await Chat.findByIdWithDetails(newChat.id);

    // Send notification to other participant
    Notification.createNotification(
      participantId,
      'new_message',
      'New Chat Started',
      `${req.user.name} started a chat about: ${item.title}`,
      {
        relatedChat: newChat.id,
        relatedItem: itemId,
        link: `/chat/${newChat.id}`,
        priority: 'medium'
      }
    ).catch(err => console.error('Notification error:', err));

    res.status(200).json({
      status: 'success',
      data: { chat: fullChat }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send message in chat
 * @route POST /api/chat/:id/message
 */
const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, messageType = 'text' } = req.body;

    if (!content || content.trim() === '') {
      throw new ApiError(400, 'Message content is required');
    }

    const chat = await Chat.findById(id);

    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    // Check if user is participant
    const isParticipant = await Chat.isParticipant(id, req.user.userId);

    if (!isParticipant) {
      throw new ApiError(403, 'Access denied');
    }

    // Add message
    const message = await Chat.addMessage(id, req.user.userId, content.trim(), messageType);

    // Get the other participant
    const otherParticipant = await Chat.getOtherParticipant(id, req.user.userId);

    // Send notification to other participant
    if (otherParticipant) {
      Notification.createNotification(
        otherParticipant,
        'new_message',
        'New Message',
        `${req.user.name} sent you a message`,
        {
          relatedChat: id,
          link: `/chat/${id}`,
          priority: 'low'
        }
      ).catch(err => console.error('Notification error:', err));
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${id}`).emit('new_message', {
        chatId: id,
        message
      });
    }

    res.status(200).json({
      status: 'success',
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Close chat
 * @route PUT /api/chat/:id/close
 */
const closeChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await Chat.findById(id);

    if (!chat) {
      throw new ApiError(404, 'Chat not found');
    }

    // Check if user is participant
    const isParticipant = await Chat.isParticipant(id, req.user.userId);

    if (!isParticipant) {
      throw new ApiError(403, 'Access denied');
    }

    await Chat.close(id, req.user.userId);

    res.status(200).json({
      status: 'success',
      message: 'Chat closed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 * @route GET /api/chat/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Chat.getUnreadCount(req.user.userId);

    res.status(200).json({
      status: 'success',
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChats,
  getChatById,
  createChat,
  sendMessage,
  closeChat,
  getUnreadCount
};
