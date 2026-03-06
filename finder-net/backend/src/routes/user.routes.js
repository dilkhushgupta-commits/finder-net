/**
 * User Routes
 * Routes for user profile and notifications
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get user notifications
 */
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const { data: notifications, count: total } = await Notification.findByUser(
      req.user.userId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
      }
    );

    const unreadCount = await Notification.getUnreadCount(req.user.userId);

    res.status(200).json({
      status: 'success',
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark all notifications as read (must be before :id route)
 */
router.put('/notifications/read-all', authenticate, async (req, res, next) => {
  try {
    await Notification.markAllAsRead(req.user.userId);

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark notification as read
 */
router.put('/notifications/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    if (notification.user_id !== req.user.userId) {
      throw new ApiError(403, 'Access denied');
    }

    await Notification.markAsRead(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user profile
 */
router.get('/profile/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
