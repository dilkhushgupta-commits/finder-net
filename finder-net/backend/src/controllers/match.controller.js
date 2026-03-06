/**
 * AI Matching Controller
 * Handles AI-powered item matching
 */

const Item = require('../models/Item.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { sendMatchNotificationEmail } = require('../utils/email.utils');
const { ApiError } = require('../middleware/errorHandler');
const axios = require('axios');

/**
 * Find matches for an item using AI
 * @route POST /api/match/:id
 */
const findMatches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { threshold = 0.7 } = req.body;

    const item = await Item.findById(id);

    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    // Check if AI service is available
    if (!process.env.AI_SERVICE_URL) {
      throw new ApiError(503, 'AI matching service is not configured');
    }

    // Call AI service to find matches
    const response = await axios.post(`${process.env.AI_SERVICE_URL}/find-matches`, {
      itemId: item.id,
      imageUrl: item.images[0].url,
      type: item.type === 'lost' ? 'found' : 'lost', // Find opposite type
      category: item.category,
      threshold: parseFloat(threshold)
    });

    const matches = response.data.matches || [];

    // Get full item details for matches
    const matchedItems = await Promise.all(
      matches.map(async (match) => {
        const matchedItem = await Item.findByIdWithUser(match.itemId);
        return {
          item: matchedItem,
          similarityScore: match.similarityScore,
          confidence: match.confidence
        };
      })
    );

    // Clear old matches and save new ones
    await Item.clearMatches(id);

    for (const m of matches) {
      await Item.addMatch(id, m.itemId, m.similarityScore);
    }

    if (matchedItems.length > 0) {
      await Item.findByIdAndUpdate(id, { status: 'matched' });
    }

    // Send notifications to item owner (async)
    if (matchedItems.length > 0) {
      const user = await User.findById(item.uploaded_by);

      // Create notification
      Notification.createNotification(
        user.id,
        'match_found',
        'Potential Matches Found!',
        `We found ${matchedItems.length} potential match(es) for your ${item.type} item: ${item.title}`,
        {
          relatedItem: item.id,
          link: `/items/${item.id}`,
          priority: 'high'
        }
      ).catch(err => console.error('Notification error:', err));

      // Send email
      sendMatchNotificationEmail(user, item, matchedItems[0].item)
        .catch(err => console.error('Email error:', err));
    }

    res.status(200).json({
      status: 'success',
      message: `Found ${matchedItems.length} potential match(es)`,
      data: {
        itemId: item.id,
        matches: matchedItems
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return next(new ApiError(503, 'AI matching service is currently unavailable'));
    }
    next(error);
  }
};

/**
 * Get matches for a specific item
 * @route GET /api/match/:id/matches
 */
const getMatches = async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await Item.findById(id);
    if (!item) {
      throw new ApiError(404, 'Item not found');
    }

    const matches = await Item.getMatches(id);

    // Format matches
    const validMatches = matches
      .filter(m => m.items)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .map(m => ({
        item: m.items,
        similarityScore: m.similarity_score,
        matchedAt: m.matched_at,
        confidence: m.similarity_score > 0.9 ? 'high' : m.similarity_score > 0.7 ? 'medium' : 'low'
      }));

    res.status(200).json({
      status: 'success',
      data: {
        itemId: item.id,
        totalMatches: validMatches.length,
        matches: validMatches
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually report a match between two items
 * @route POST /api/match/report
 */
const reportMatch = async (req, res, next) => {
  try {
    const { item1Id, item2Id, notes } = req.body;

    const item1 = await Item.findById(item1Id);
    const item2 = await Item.findById(item2Id);

    if (!item1 || !item2) {
      throw new ApiError(404, 'One or both items not found');
    }

    // Add bidirectional matches with lower confidence
    await Item.addMatch(item1.id, item2.id, 0.5);
    await Item.addMatch(item2.id, item1.id, 0.5);

    // Notify both users
    const user1 = await User.findById(item1.uploaded_by);
    const user2 = await User.findById(item2.uploaded_by);

    if (user1) {
      Notification.createNotification(
        user1.id,
        'match_found',
        'Potential Match Reported',
        `A user reported a potential match for your item: ${item1.title}`,
        { relatedItem: item1.id, priority: 'medium' }
      ).catch(err => console.error('Notification error:', err));
    }

    if (user2) {
      Notification.createNotification(
        user2.id,
        'match_found',
        'Potential Match Reported',
        `A user reported a potential match for your item: ${item2.title}`,
        { relatedItem: item2.id, priority: 'medium' }
      ).catch(err => console.error('Notification error:', err));
    }

    res.status(200).json({
      status: 'success',
      message: 'Match reported successfully',
      data: {
        item1: item1.id,
        item2: item2.id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all matches for current user's items
 * @route GET /api/match/user/matches
 */
const getUserMatches = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const matchData = await Item.getUserItemsWithMatches(userId);

    // Format matches
    const allMatches = matchData.map(({ userItem, match }) => ({
      userItem: {
        _id: userItem.id,
        title: userItem.title,
        type: userItem.type,
        images: userItem.images
      },
      matchedItem: match.items || null,
      similarityScore: match.similarity_score,
      matchedAt: match.matched_at,
      confidence: match.similarity_score > 0.9 ? 'high' : match.similarity_score > 0.7 ? 'medium' : 'low'
    }));

    // Sort by similarity score
    allMatches.sort((a, b) => b.similarityScore - a.similarityScore);

    res.status(200).json({
      status: 'success',
      data: {
        totalMatches: allMatches.length,
        matches: allMatches
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  findMatches,
  getMatches,
  reportMatch,
  getUserMatches
};
