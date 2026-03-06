/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Supabase / PostgreSQL errors
  if (err.code === '23505') {
    statusCode = 400;
    message = 'A record with that value already exists';
  }

  if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record not found';
  }

  if (err.code === '23514') {
    statusCode = 400;
    message = 'Validation constraint failed';
  }

  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large. Maximum size is 5MB';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = err.message;
    }
  }

  // Log error (always log server-side, but control what client sees)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      statusCode
    });
  } else if (statusCode >= 500) {
    // In production, log server errors for monitoring
    console.error(`[ERROR] ${statusCode} ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  // Send error response — never expose stack in production
  res.status(statusCode).json({
    status: 'error',
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  errorHandler,
  notFound,
  asyncHandler
};
