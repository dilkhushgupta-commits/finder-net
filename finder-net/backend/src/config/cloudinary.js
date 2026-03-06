/**
 * Cloudinary Configuration
 * Image upload and storage service
 */

const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_CLOUD_NAME !== 'demo' &&
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_KEY !== 'demo';
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

// Ensure uploads directory exists for local storage
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload image to Cloudinary or local storage
 * @param {String} filePath - Local file path or base64 string
 * @param {String} folder - Cloudinary folder name
 * @returns {Object} Upload result with URL
 */
const uploadImage = async (filePath, folder = 'finder-net') => {
  try {
    // If Cloudinary is configured, use it
    if (isCloudinaryConfigured()) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };
    }

    // Fallback to local storage for development
    console.log('[DEV] Using local file storage instead of Cloudinary');
    
    // Extract base64 data
    const matches = filePath.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image data');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const ext = mimeType.split('/')[1] || 'jpg';
    
    // Generate unique filename
    const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
    const localPath = path.join(uploadsDir, filename);
    
    // Save file locally
    fs.writeFileSync(localPath, base64Data, 'base64');
    
    // Return local URL (for dev server)
    const localUrl = `/uploads/${filename}`;
    
    return {
      url: localUrl,
      publicId: filename,
      width: 1000,
      height: 1000,
      format: ext
    };
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Image upload failed');
  }
};

/**
 * Delete image from Cloudinary or local storage
 * @param {String} publicId - Cloudinary public ID or local filename
 */
const deleteImage = async (publicId) => {
  try {
    if (isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      // Delete local file
      const localPath = path.join(uploadsDir, publicId);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
  } catch (error) {
    console.error('Image delete error:', error);
    throw new Error('Image deletion failed');
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};
