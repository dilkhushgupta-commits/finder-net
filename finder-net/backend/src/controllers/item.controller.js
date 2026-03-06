/**
 * Item Controller
 * Handles lost and found item operations
 */

const Item = require('../models/Item.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { generateItemQRCode, generateVerificationCode } = require('../utils/qrcode.utils');
const { ApiError } = require('../middleware/errorHandler');
const axios = require('axios');

/**
 * Create new item (lost or found)
 * @route POST /api/items
 */
const createItem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      type,
      location,
      date,
      time,
      contactEmail,
      contactPhone
    } = req.body;

    // Check if image was uploaded
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, 'At least one image is required');
    }

    // Upload images to Cloudinary
    const imageUploads = await Promise.all(
      req.files.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        return await uploadImage(dataURI, `finder-net/${type}`);
      })
    );

    const images = imageUploads.map(upload => ({
      url: upload.url,
      publicId: upload.publicId
    }));

    // Generate verification code and QR code
    const verificationCode = generateVerificationCode();

    // Parse location
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;

    // Create item (auto-approved for now)
    const item = await Item.create({
      title,
      description,
      category,
      type,
      status: 'approved',
      images,
      location: parsedLocation,
      date,
      time: time || null,
      uploaded_by: req.user.userId,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      verification_code: verificationCode
    });

    // Generate QR code
    const qrCode = await generateItemQRCode(item.id, verificationCode);
    const updatedItem = await Item.findByIdAndUpdate(item.id, { qr_code: qrCode });

    // Update user's items reported count
    await User.increment(req.user.userId, 'items_reported', 1);

    // Send to AI service for feature extraction (async)
    if (process.env.AI_SERVICE_URL) {
      axios.post(`${process.env.AI_SERVICE_URL}/extract-features`, {
        itemId: item.id,
        imageUrl: images[0].url
      }).catch(err => console.error('AI feature extraction error:', err));
    }

    res.status(201).json({
      status: 'success',
      message: 'Item created successfully!',
      data: { item: updatedItem || item }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all items with filters
 * @route GET /api/items
 */
const getItems = async (req, res, next) => {
  try {
    const {
      type,
      category,
      status,
      city,
      search,
      page = 1,
      limit = 12,
      sortBy = '-createdAt'
    } = req.query;

    // Build filter object
    const filter = { is_active: true };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = 'approved'; // Only show approved items by default

    // Parse sort
    let sort = 'created_at';
    let order = 'desc';
    if (sortBy) {
      if (sortBy.startsWith('-')) {
        sort = sortBy.substring(1).replace('createdAt', 'created_at');
        order = 'desc';
      } else {
        sort = sortBy.replace('createdAt', 'created_at');
        order = 'asc';
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const { data: items, count: total } = await Item.findAll({
      filter,
      sort,
      order,
      skip,
      limit: parseInt(limit),
      search: search || null,
      city: city || null
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

/**
 * Get single item by ID
 * @route GET /api/items/:id
 */
const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findByIdWithUser(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    // Increment view count
    await Item.incrementViews(id);

    res.status(200).json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's items
 * @route GET /api/items/my-items
 */
const getMyItems = async (req, res, next) => {
  try {
    const { type, status } = req.query;

    const filter = { is_active: true };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const items = await Item.findByUser(req.user.userId, filter);

    res.status(200).json({
      status: 'success',
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update item
 * @route PUT /api/items/:id
 */
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await Item.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    // Check ownership
    if (item.uploaded_by !== req.user.userId) {
      throw new ApiError(403, 'You can only update your own items');
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'category', 'location', 'date', 'time', 'contact_email', 'contact_phone'];
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      // Map camelCase from frontend to snake_case
      const camelField = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      } else if (updates[camelField] !== undefined) {
        filteredUpdates[field] = updates[camelField];
      }
    });

    const updatedItem = await Item.findByIdAndUpdate(id, filteredUpdates);

    res.status(200).json({
      status: 'success',
      message: 'Item updated successfully',
      data: { item: updatedItem }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete item
 * @route DELETE /api/items/:id
 */
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    // Check ownership
    if (item.uploaded_by !== req.user.userId) {
      throw new ApiError(403, 'You can only delete your own items');
    }

    // Soft delete
    await Item.findByIdAndUpdate(id, { is_active: false });

    // Delete images from Cloudinary (async)
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach(image => {
        if (image.publicId) {
          deleteImage(image.publicId).catch(err =>
            console.error('Image deletion error:', err)
          );
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark item as recovered
 * @route PUT /api/items/:id/recover
 */
const markAsRecovered = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recoveredById } = req.body;

    const item = await Item.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    // Check ownership
    if (item.uploaded_by !== req.user.userId) {
      throw new ApiError(403, 'Only the item owner can mark it as recovered');
    }

    const updatedItem = await Item.findByIdAndUpdate(id, {
      status: 'recovered',
      recovered_at: new Date().toISOString(),
      recovered_by: recoveredById || null
    });

    // Update recovery statistics
    await User.increment(req.user.userId, 'items_recovered', 1);

    if (recoveredById) {
      await User.increment(recoveredById, 'reputation', 10);
    }

    res.status(200).json({
      status: 'success',
      message: 'Item marked as recovered',
      data: { item: updatedItem }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get item statistics
 * @route GET /api/items/stats
 */
const getItemStats = async (req, res, next) => {
  try {
    const overall = await Item.getStats();
    const byCategory = await Item.getCategoryStats();

    res.status(200).json({
      status: 'success',
      data: {
        overall,
        byCategory
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createItem,
  getItems,
  getItemById,
  getMyItems,
  updateItem,
  deleteItem,
  markAsRecovered,
  getItemStats
};
