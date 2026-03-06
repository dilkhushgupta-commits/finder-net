/**
 * User Model
 * Supabase query helpers for users table
 */

const { supabase } = require('../config/database');
const bcrypt = require('bcryptjs');

const TABLE = 'users';

const User = {
  /**
   * Create a new user
   */
  async create({ name, email, password, phone, role }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
        role: role || 'user'
      })
      .select('id, name, email, role, phone, avatar, is_verified, items_reported, items_recovered, reputation, is_active, last_login, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Find user by ID
   */
  async findById(id, includePassword = false) {
    const columns = includePassword
      ? '*'
      : 'id, name, email, role, phone, avatar, is_verified, items_reported, items_recovered, reputation, is_active, last_login, created_at, updated_at';

    const { data, error } = await supabase
      .from(TABLE)
      .select(columns)
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Find user by email
   */
  async findByEmail(email, includePassword = false) {
    const columns = includePassword
      ? '*'
      : 'id, name, email, role, phone, avatar, is_verified, items_reported, items_recovered, reputation, is_active, last_login, created_at, updated_at';

    const { data, error } = await supabase
      .from(TABLE)
      .select(columns)
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Find one user matching a filter
   */
  async findOne(filter) {
    let query = supabase.from(TABLE).select('*');
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query.single();
    if (error) return null;
    return data;
  },

  /**
   * Update user by ID
   */
  async findByIdAndUpdate(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select('id, name, email, role, phone, avatar, is_verified, items_reported, items_recovered, reputation, is_active, last_login, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Increment a numeric field
   */
  async increment(id, field, amount = 1) {
    const user = await this.findById(id);
    if (!user) return null;

    const { data, error } = await supabase
      .from(TABLE)
      .update({ [field]: (user[field] || 0) + amount })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Compare password
   */
  async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Count documents matching filter
   */
  async countDocuments(filter = {}) {
    let query = supabase.from(TABLE).select('id', { count: 'exact', head: true });
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or') continue; // handled separately
      query = query.eq(key, value);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  /**
   * Find users with pagination and search
   */
  async findAll({ filter = {}, sort = 'created_at', order = 'desc', skip = 0, limit = 20, search = null }) {
    let query = supabase
      .from(TABLE)
      .select('id, name, email, role, phone, avatar, is_verified, items_reported, items_recovered, reputation, is_active, last_login, created_at, updated_at', { count: 'exact' });

    for (const [key, value] of Object.entries(filter)) {
      if (key === '$or') continue;
      query = query.eq(key, value);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const ascending = order === 'asc';
    query = query.order(sort, { ascending }).range(skip, skip + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  /**
   * Count users created after a date
   */
  async countCreatedAfter(date) {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', date.toISOString());

    if (error) throw error;
    return count || 0;
  },

  /**
   * Sanitize user object (remove sensitive fields)
   */
  sanitize(user) {
    if (!user) return null;
    const { password, verification_token, reset_password_token, reset_password_expires, ...safe } = user;
    return safe;
  }
};

module.exports = User;
