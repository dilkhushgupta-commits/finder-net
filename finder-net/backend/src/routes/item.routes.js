/**
 * Item Routes
 * Routes for lost and found item operations
 */

const express = require('express');
const router = express.Router();
const {
  createItem,
  getItems,
  getItemById,
  getMyItems,
  updateItem,
  deleteItem,
  markAsRecovered,
  getItemStats
} = require('../controllers/item.controller');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { itemValidation, idValidation } = require('../middleware/validation.middleware');
const { uploadMultiple } = require('../middleware/upload.middleware');

// Public routes
router.get('/', optionalAuth, getItems);
router.get('/stats', getItemStats);

// Protected routes (static paths before dynamic :id)
router.post('/', authenticate, uploadMultiple, itemValidation, createItem);
router.get('/user/my-items', authenticate, getMyItems);

// Dynamic :id routes
router.get('/:id', idValidation, getItemById);
router.put('/:id', authenticate, idValidation, updateItem);
router.delete('/:id', authenticate, idValidation, deleteItem);
router.put('/:id/recover', authenticate, idValidation, markAsRecovered);

module.exports = router;
