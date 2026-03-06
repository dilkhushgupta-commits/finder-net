/**
 * Chat Routes
 * Routes for real-time chat functionality
 */

const express = require('express');
const router = express.Router();
const {
  getChats,
  getChatById,
  createChat,
  sendMessage,
  closeChat,
  getUnreadCount
} = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { idValidation } = require('../middleware/validation.middleware');

// All routes require authentication
router.get('/', authenticate, getChats);
router.get('/unread-count', authenticate, getUnreadCount);
router.post('/', authenticate, createChat);
router.get('/:id', authenticate, idValidation, getChatById);
router.post('/:id/message', authenticate, idValidation, sendMessage);
router.put('/:id/close', authenticate, idValidation, closeChat);

module.exports = router;
