/**
 * Authentication Routes
 * Routes for user authentication and profile management
 */

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation
} = require('../middleware/validation.middleware');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', emailValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
