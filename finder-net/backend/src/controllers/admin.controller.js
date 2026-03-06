/**
 * Admin Controller
 * Admin panel operations
 */

const Item = require('../models/Item.model');
const User = require('../models/User.model');
const Chat = require('../models/Chat.model');
const Notification = require('../models/Notification.model');
const { sendItemApprovalEmail } = require('../utils/email.utils');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Get admin dashboard statistics
 * @route GET /api/admin/stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalItems,
      pendingItems,
      recoveredItems,
      totalChats,
      lostItems,
      foundItems
    ] = await Promise.all([
      User.countDocuments({ is_active: true }),
      Item.countDocuments({ is_active: true }),
      Item.countDocuments({ status: 'pending' }),
      Item.countDocuments({ status: 'recovered' }),
      Chat.countDocuments({ is_active: true }),
      Item.countDocuments({ is_active: true, type: 'lost' }),
      Item.countDocuments({ is_active: true, type: 'found' })
    ]);

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countCreatedAfter(thirtyDaysAgo);

    // Recovery rate
    const recoveryRate = totalItems > 0
      ? ((recoveredItems / totalItems) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalItems,
        pendingItems,
        recoveredItems,
        totalChats,
        recentUsers,
        recoveryRate,
        itemsByType: {
          lost: lostItems,
          found: foundItems
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending items for approval
 * @route GET /api/admin/items/pending
 */
const getPendingItems = async (req, res, next) => {
  try {
    const { data: items } = await Item.findAll({
      filter: { status: 'pending', is_active: true },
      sort: 'created_at',
      order: 'desc',
      limit: 100
    });

    res.status(200).json({
      status: 'success',
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve item
 * @route PUT /api/admin/items/:id/approve
 */
const approveItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const item = await Item.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    const updates = { status: 'approved' };
    if (adminNotes) updates.admin_notes = adminNotes;

    const updatedItem = await Item.findByIdAndUpdate(id, updates);

    // Get user and send notification
    const user = await User.findById(item.uploaded_by);

    if (user) {
      // Create notification
      await Notification.createNotification(
        user.id,
        'item_approved',
        'Item Approved',
        `Your ${item.type} item "${item.title}" has been approved`,
        {
          relatedItem: item.id,
          link: `/items/${item.id}`,
          priority: 'high'
        }
      );

      // Send email
      sendItemApprovalEmail(user, item, true)
        .catch(err => console.error('Email error:', err));
    }

    res.status(200).json({
      status: 'success',
      message: 'Item approved successfully',
      data: { item: updatedItem }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject item
 * @route PUT /api/admin/items/:id/reject
 */
const rejectItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const item = await Item.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    const updates = { status: 'rejected' };
    if (adminNotes) updates.admin_notes = adminNotes;

    const updatedItem = await Item.findByIdAndUpdate(id, updates);

    // Get user and send notification
    const user = await User.findById(item.uploaded_by);

    if (user) {
      // Create notification
      await Notification.createNotification(
        user.id,
        'item_rejected',
        'Item Rejected',
        `Your ${item.type} item "${item.title}" was rejected. ${adminNotes || ''}`,
        {
          relatedItem: item.id,
          priority: 'high'
        }
      );

      // Send email
      sendItemApprovalEmail(user, item, false)
        .catch(err => console.error('Email error:', err));
    }

    res.status(200).json({
      status: 'success',
      message: 'Item rejected',
      data: { item: updatedItem }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * @route GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const { data: users, count: total } = await User.findAll({
      skip,
      limit: parseInt(limit),
      search: search || null,
      sort: 'created_at',
      order: 'desc'
    });

    res.status(200).json({
      status: 'success',
      data: {
        users,
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
};

/**
 * Deactivate user
 * @route PUT /api/admin/users/:id/deactivate
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.role === 'admin') {
      throw new ApiError(403, 'Cannot deactivate admin users');
    }

    await User.findByIdAndUpdate(id, { is_active: false });

    res.status(200).json({
      status: 'success',
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate user
 * @route PUT /api/admin/users/:id/activate
 */
const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await User.findByIdAndUpdate(id, { is_active: true });

    res.status(200).json({
      status: 'success',
      message: 'User activated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete item (admin)
 * @route DELETE /api/admin/items/:id
 */
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    await Item.findByIdAndUpdate(id, { is_active: false });

    res.status(200).json({
      status: 'success',
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all items (admin view)
 * @route GET /api/admin/items
 */
const getAllItems = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;

    const filter = { is_active: true };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const { data: items, count: total } = await Item.findAll({
      filter,
      sort: 'created_at',
      order: 'desc',
      skip,
      limit: parseInt(limit)
    });

    res.status(200).json({
      status: 'success',
      data: {
        items,
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
};

module.exports = {
  getDashboardStats,
  getPendingItems,
  approveItem,
  rejectItem,
  getAllUsers,
  deactivateUser,
  activateUser,
  deleteItem,
  getAllItems
};
