/**
 * Authentication Controller
 * Handles user registration, login, and password management
 */

const User = require('../models/User.model');
const { generateToken } = require('../utils/jwt.utils');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email.utils');
const { ApiError } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * Register new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || null
    });

    // Generate token
    const token = generateToken(user.id);

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user).catch(err => console.error('Welcome email error:', err));

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findByEmail(email, true);

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ApiError(403, 'Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await User.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    await User.findByIdAndUpdate(user.id, { last_login: new Date().toISOString() });

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          itemsReported: user.items_reported,
          itemsRecovered: user.items_recovered
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

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
};

/**
 * Forgot password - send reset email
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        status: 'success',
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findByIdAndUpdate(user.id, {
      reset_password_token: hashedToken,
      reset_password_expires: new Date(Date.now() + 3600000).toISOString() // 1 hour
    });

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    // Hash the token from URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      reset_password_token: hashedToken
    });

    if (!user || new Date(user.reset_password_expires) < new Date()) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expires: null
    });

    // Generate new token
    const authToken = generateToken(user.id);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
      data: { token: authToken }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (for logged-in users)
 * @route PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId, true);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await User.comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Hash and update password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.userId, { password: hashedPassword });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Update allowed fields
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    const updated = await User.findByIdAndUpdate(req.user.userId, updates);

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: updated }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile
};
