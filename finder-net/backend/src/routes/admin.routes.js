/**
 * Admin Routes
 * Routes for admin panel operations
 */

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getPendingItems,
  approveItem,
  rejectItem,
  getAllUsers,
  deactivateUser,
  activateUser,
  deleteItem,
  getAllItems
} = require('../controllers/admin.controller');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const { idValidation } = require('../middleware/validation.middleware');

// All routes require authentication and admin role
router.use(authenticate, isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Items management
router.get('/items', getAllItems);
router.get('/items/pending', getPendingItems);
router.put('/items/:id/approve', idValidation, approveItem);
router.put('/items/:id/reject', idValidation, rejectItem);
router.delete('/items/:id', idValidation, deleteItem);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/deactivate', idValidation, deactivateUser);
router.put('/users/:id/activate', idValidation, activateUser);

module.exports = router;
