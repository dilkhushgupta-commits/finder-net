/**
 * Validation Middleware
 * Input validation for API requests
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validate results from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  next();
};

/**
 * User registration validation rules
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('phone')
    .optional({ values: 'falsy' })
    .matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),

  validate
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate
];

/**
 * Item creation validation rules
 */
const itemValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Item title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3-100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10-1000 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Electronics', 'Clothing', 'Accessories', 'Documents', 'Bags', 'Jewelry', 'Keys', 'Pets', 'Sports Equipment', 'Books', 'Wallets', 'Mobile Phones', 'Laptops', 'Watches', 'Other'])
    .withMessage('Invalid category'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['lost', 'found']).withMessage('Type must be either lost or found'),

  body('location')
    .notEmpty().withMessage('Location is required')
    .custom((value) => {
      try {
        const location = typeof value === 'string' ? JSON.parse(value) : value;
        if (!location.address || !location.address.trim()) {
          throw new Error('Location address is required');
        }
        if (!location.city || !location.city.trim()) {
          throw new Error('City is required');
        }
        return true;
      } catch (e) {
        if (e.message.includes('address') || e.message.includes('City')) {
          throw e;
        }
        throw new Error('Invalid location format');
      }
    }),

  body('date')
    .notEmpty().withMessage('Date is required')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return true;
    }),

  validate
];

/**
 * UUID parameter validation (replaces isMongoId)
 */
const idValidation = [
  param('id')
    .isUUID().withMessage('Invalid ID format'),

  validate
];

/**
 * Email validation
 */
const emailValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),

  validate
];

/**
 * Password reset validation
 */
const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  itemValidation,
  idValidation,
  emailValidation,
  resetPasswordValidation
};
