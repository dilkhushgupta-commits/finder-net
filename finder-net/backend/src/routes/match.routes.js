/**
 * Match Routes
 * Routes for AI-powered item matching
 */

const express = require('express');
const router = express.Router();
const {
  findMatches,
  getMatches,
  reportMatch,
  getUserMatches
} = require('../controllers/match.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { idValidation } = require('../middleware/validation.middleware');

// All routes require authentication
// Static paths before dynamic :id
router.get('/user/matches', authenticate, getUserMatches);
router.post('/report', authenticate, reportMatch);

// Dynamic :id routes
router.post('/:id', authenticate, idValidation, findMatches);
router.get('/:id/matches', authenticate, idValidation, getMatches);

module.exports = router;
