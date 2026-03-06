/**
 * File Upload Middleware
 * Multer configuration for image uploads
 */

const multer = require('multer');
const path = require('path');
const { ApiError } = require('./errorHandler');

// Configure memory storage
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: fileFilter
});

// Single file upload
const uploadSingle = upload.single('image');

// Multiple files upload (max 5 images)
const uploadMultiple = upload.array('images', 5);

module.exports = {
  uploadSingle,
  uploadMultiple
};
