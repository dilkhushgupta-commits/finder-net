/**
 * Item Model
 * Supabase query helpers for items table
 */

const { supabase } = require('../config/database');

const TABLE = 'items';
const MATCHES_TABLE = 'item_matches';

const Item = {
  /**
   * Create a new item
   */
  async create(itemData) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(itemData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Find item by ID
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
   * Find item by ID with uploader info
   */
  async findByIdWithUser(id) {
    const item = await this.findById(id);
    if (!item) return null;

    // Get uploader info
    const { data: uploader } = await supabase
      .from('users')
      .select('id, name, avatar, email, phone, items_reported, items_recovered, reputation')
      .eq('id', item.uploaded_by)
      .single();

    item.uploaded_by_user = uploader || null;

    // Get recovered_by user if exists
    if (item.recovered_by) {
      const { data: recoverer } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', item.recovered_by)
        .single();
      item.recovered_by_user = recoverer || null;
    }

    return item;
  },

  /**
   * Find items with filters and pagination
   */
  async findAll({ filter = {}, sort = 'created_at', order = 'desc', skip = 0, limit = 12, search = null, city = null }) {
    let query = supabase.from(TABLE).select('*, users:uploaded_by(id, name, avatar, email)', { count: 'exact' });

    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }

    if (city) {
      query = query.ilike('location->>city', `%${city}%`);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const ascending = order === 'asc';
    query = query.order(sort, { ascending }).range(skip, skip + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  /**
   * Find items by uploader
   */
  async findByUser(userId, filter = {}) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .eq('uploaded_by', userId);

    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Update item by ID
   */
  async findByIdAndUpdate(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Increment views
   */
  async incrementViews(id) {
    const item = await this.findById(id);
    if (!item) return null;

    return this.findByIdAndUpdate(id, { views: (item.views || 0) + 1 });
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
  },

  /**
   * Get item statistics (aggregated)
   */
  async getStats() {
    const [totalRes, lostRes, foundRes, recoveredRes, pendingRes] = await Promise.all([
      supabase.from(TABLE).select('id', { count: 'exact', head: true }),
      supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('type', 'lost'),
      supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('type', 'found'),
      supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('status', 'recovered'),
      supabase.from(TABLE).select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return {
      totalItems: totalRes.count || 0,
      lostItems: lostRes.count || 0,
      foundItems: foundRes.count || 0,
      recoveredItems: recoveredRes.count || 0,
      pendingItems: pendingRes.count || 0
    };
  },

  /**
   * Get category statistics
   */
  async getCategoryStats() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    const counts = {};
    (data || []).forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([category, count]) => ({ _id: category, count }))
      .sort((a, b) => b.count - a.count);
  },

  // ---- MATCHES ----

  /**
   * Add a match between two items
   */
  async addMatch(itemId, matchedItemId, similarityScore) {
    const { data, error } = await supabase
      .from(MATCHES_TABLE)
      .insert({
        item_id: itemId,
        matched_item_id: matchedItemId,
        similarity_score: similarityScore,
        matched_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get matches for an item
   */
  async getMatches(itemId) {
    const { data, error } = await supabase
      .from(MATCHES_TABLE)
      .select('*, items:matched_item_id(*, users:uploaded_by(id, name, avatar, email))')
      .eq('item_id', itemId)
      .order('similarity_score', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Delete all matches for an item
   */
  async clearMatches(itemId) {
    const { error } = await supabase
      .from(MATCHES_TABLE)
      .delete()
      .eq('item_id', itemId);

    if (error) throw error;
  },

  /**
   * Get all items by user that have matches
   */
  async getUserItemsWithMatches(userId) {
    // First get user's items
    const { data: userItems, error } = await supabase
      .from(TABLE)
      .select('id, title, type, images')
      .eq('uploaded_by', userId)
      .eq('is_active', true);

    if (error) throw error;
    if (!userItems || userItems.length === 0) return [];

    const itemIds = userItems.map(i => i.id);

    // Get matches for those items
    const { data: matches, error: matchError } = await supabase
      .from(MATCHES_TABLE)
      .select('*, items:matched_item_id(*, users:uploaded_by(id, name, avatar, email))')
      .in('item_id', itemIds)
      .order('similarity_score', { ascending: false });

    if (matchError) throw matchError;

    // Map matches back to user items
    const itemMap = {};
    userItems.forEach(i => { itemMap[i.id] = i; });

    return (matches || []).map(m => ({
      userItem: itemMap[m.item_id],
      match: m
    }));
  },

  /**
   * Get items by type and category with feature vectors (for AI matching)
   */
  async getItemsByTypeAndCategory(type, category) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, ai_feature_vector')
      .eq('type', type)
      .eq('category', category)
      .eq('status', 'approved')
      .eq('is_active', true)
      .not('ai_feature_vector', 'is', null);

    if (error) throw error;
    return data || [];
  }
};

module.exports = Item;
