/**
 * Notification Model
 * Supabase query helpers for notifications table
 */

const { supabase } = require('../config/database');

const TABLE = 'notifications';

const Notification = {
  /**
   * Create a notification
   */
  async createNotification(userId, type, title, message, options = {}) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_item: options.relatedItem || null,
        related_chat: options.relatedChat || null,
        link: options.link || null,
        priority: options.priority || 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Find notification by ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const { error } = await supabase
      .from(TABLE)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Get notifications for a user with pagination
   */
  async findByUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const skip = (page - 1) * limit;

    let query = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // Enrich with related item data
    const enriched = await Promise.all((data || []).map(async (notif) => {
      if (notif.related_item) {
        const { data: item } = await supabase
          .from('items')
          .select('id, title, type, images')
          .eq('id', notif.related_item)
          .single();
        notif.related_item_data = item || null;
      }
      return notif;
    }));

    return { data: enriched, count: count || 0 };
  },

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Count documents
   */
  async countDocuments(filter = {}) {
    let query = supabase.from(TABLE).select('id', { count: 'exact', head: true });
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }
};

module.exports = Notification;
