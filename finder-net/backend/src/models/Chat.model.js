/**
 * Chat Model
 * Supabase query helpers for chats, messages, and chat_participants tables
 */

const { supabase } = require('../config/database');

const CHATS_TABLE = 'chats';
const PARTICIPANTS_TABLE = 'chat_participants';
const MESSAGES_TABLE = 'messages';
const READS_TABLE = 'message_reads';

const Chat = {
  /**
   * Create a new chat
   */
  async create({ participants, relatedItem }) {
    // Create chat record
    const { data: chat, error } = await supabase
      .from(CHATS_TABLE)
      .insert({ related_item: relatedItem })
      .select()
      .single();

    if (error) throw error;

    // Add participants
    const participantRows = participants.map(userId => ({
      chat_id: chat.id,
      user_id: userId
    }));

    const { error: pError } = await supabase
      .from(PARTICIPANTS_TABLE)
      .insert(participantRows);

    if (pError) throw pError;

    return chat;
  },

  /**
   * Find chat by ID
   */
  async findById(id) {
    const { data, error } = await supabase
      .from(CHATS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Find chat by ID with full details (participants, item, messages)
   */
  async findByIdWithDetails(id) {
    const chat = await this.findById(id);
    if (!chat) return null;

    // Get participants
    const { data: participants } = await supabase
      .from(PARTICIPANTS_TABLE)
      .select('user_id, users(id, name, avatar, email)')
      .eq('chat_id', id);

    chat.participants = (participants || []).map(p => p.users);

    // Get related item
    const { data: item } = await supabase
      .from('items')
      .select('id, title, type, category, images, uploaded_by')
      .eq('id', chat.related_item)
      .single();

    chat.related_item_data = item || null;

    // Get messages with sender info
    const { data: messages } = await supabase
      .from(MESSAGES_TABLE)
      .select('*, users!messages_sender_fkey(id, name, avatar)')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });

    chat.messages = messages || [];

    return chat;
  },

  /**
   * Find all chats for a user
   */
  async findByUser(userId) {
    // Get chat IDs for user
    const { data: participantRows, error } = await supabase
      .from(PARTICIPANTS_TABLE)
      .select('chat_id')
      .eq('user_id', userId);

    if (error) throw error;
    if (!participantRows || participantRows.length === 0) return [];

    const chatIds = participantRows.map(p => p.chat_id);

    // Get chats with details
    const { data: chats } = await supabase
      .from(CHATS_TABLE)
      .select('*')
      .in('id', chatIds)
      .eq('is_active', true)
      .order('last_message_timestamp', { ascending: false, nullsFirst: false });

    if (!chats || chats.length === 0) return [];

    // Enrich with participants, item info, last message sender
    const enriched = await Promise.all(chats.map(async (chat) => {
      const { data: participants } = await supabase
        .from(PARTICIPANTS_TABLE)
        .select('users(id, name, avatar, email)')
        .eq('chat_id', chat.id);

      chat.participants = (participants || []).map(p => p.users);

      const { data: item } = await supabase
        .from('items')
        .select('id, title, type, category, images')
        .eq('id', chat.related_item)
        .single();

      chat.related_item_data = item || null;

      if (chat.last_message_sender) {
        const { data: sender } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', chat.last_message_sender)
          .single();
        chat.last_message_sender_data = sender || null;
      }

      return chat;
    }));

    return enriched;
  },

  /**
   * Find existing chat between two users for an item
   */
  async findExisting(participant1, participant2, itemId) {
    // Get chats where participant1 is a member
    const { data: p1Chats } = await supabase
      .from(PARTICIPANTS_TABLE)
      .select('chat_id')
      .eq('user_id', participant1);

    if (!p1Chats || p1Chats.length === 0) return null;

    const p1ChatIds = p1Chats.map(p => p.chat_id);

    // Among those, find where participant2 is also a member
    const { data: p2Chats } = await supabase
      .from(PARTICIPANTS_TABLE)
      .select('chat_id')
      .eq('user_id', participant2)
      .in('chat_id', p1ChatIds);

    if (!p2Chats || p2Chats.length === 0) return null;

    const sharedChatIds = p2Chats.map(p => p.chat_id);

    // Find the chat related to this item
    const { data: chat } = await supabase
      .from(CHATS_TABLE)
      .select('*')
      .in('id', sharedChatIds)
      .eq('related_item', itemId)
      .single();

    return chat || null;
  },

  /**
   * Add a message to a chat
   */
  async addMessage(chatId, senderId, content, messageType = 'text') {
    // Insert message
    const { data: message, error } = await supabase
      .from(MESSAGES_TABLE)
      .insert({
        chat_id: chatId,
        sender: senderId,
        content,
        message_type: messageType
      })
      .select('*, users!messages_sender_fkey(id, name, avatar)')
      .single();

    if (error) throw error;

    // Mark as read by sender
    await supabase
      .from(READS_TABLE)
      .insert({ message_id: message.id, user_id: senderId })
      .select();

    // Update last message on chat
    await supabase
      .from(CHATS_TABLE)
      .update({
        last_message_content: content,
        last_message_timestamp: message.created_at,
        last_message_sender: senderId
      })
      .eq('id', chatId);

    return message;
  },

  /**
   * Mark all messages in a chat as read by a user
   */
  async markAsRead(chatId, userId) {
    // Get all messages in chat not yet read by user
    const { data: messages } = await supabase
      .from(MESSAGES_TABLE)
      .select('id')
      .eq('chat_id', chatId);

    if (!messages || messages.length === 0) return;

    const messageIds = messages.map(m => m.id);

    // Get already-read message IDs
    const { data: alreadyRead } = await supabase
      .from(READS_TABLE)
      .select('message_id')
      .eq('user_id', userId)
      .in('message_id', messageIds);

    const alreadyReadIds = new Set((alreadyRead || []).map(r => r.message_id));

    // Insert reads for unread messages
    const newReads = messageIds
      .filter(id => !alreadyReadIds.has(id))
      .map(messageId => ({
        message_id: messageId,
        user_id: userId
      }));

    if (newReads.length > 0) {
      await supabase.from(READS_TABLE).insert(newReads);
    }
  },

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId) {
    // Get all chat IDs the user is part of
    const { data: participantRows } = await supabase
      .from(PARTICIPANTS_TABLE)
      .select('chat_id')
      .eq('user_id', userId);

    if (!participantRows || participantRows.length === 0) return 0;

    const chatIds = participantRows.map(p => p.chat_id);

    // Get all active chats
    const { data: activeChats } = await supabase
      .from(CHATS_TABLE)
      .select('id')
      .in('id', chatIds)
      .eq('is_active', true);

    if (!activeChats || activeChats.length === 0) return 0;

    const activeChatIds = activeChats.map(c => c.id);

    // Count messages in those chats
    const { count: totalMessages } = await supabase
      .from(MESSAGES_TABLE)
      .select('id', { count: 'exact', head: true })
      .in('chat_id', activeChatIds);

    // Count messages read by this user in those chats
    const { data: allMessages } = await supabase
      .from(MESSAGES_TABLE)
      .select('id')
      .in('chat_id', activeChatIds);

    if (!allMessages || allMessages.length === 0) return 0;

    const allMsgIds = allMessages.map(m => m.id);

    const { count: readCount } = await supabase
      .from(READS_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('message_id', allMsgIds);

    return (totalMessages || 0) - (readCount || 0);
  },

  /**
   * Check if user is participant
   */
  async isParticipant(chatId, userId) {
    const { data } = await supabase
      .from(PARTICIPANTS_TABLE)
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    return !!data;
  },

  /**
   * Close a chat
   */
  async close(chatId, userId) {
    const { data, error } = await supabase
      .from(CHATS_TABLE)
      .update({
        is_active: false,
        closed_at: new Date().toISOString(),
        closed_by: userId
      })
      .eq('id', chatId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Count active chats
   */
  async countDocuments(filter = {}) {
    let query = supabase.from(CHATS_TABLE).select('id', { count: 'exact', head: true });
    for (const [key, value] of Object.entries(filter)) {
      query = query.eq(key, value);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  /**
   * Get other participant in a chat
   */
  async getOtherParticipant(chatId, userId) {
    const { data } = await supabase
      .from(PARTICIPANTS_TABLE)
      .select('user_id')
      .eq('chat_id', chatId)
      .neq('user_id', userId)
      .single();

    return data ? data.user_id : null;
  }
};

module.exports = Chat;
