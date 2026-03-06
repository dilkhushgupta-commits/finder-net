-- ============================================
-- Finder-Net: Supabase Database Migration
-- Migrates from MongoDB to PostgreSQL/Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT DEFAULT NULL,
  avatar TEXT DEFAULT 'https://res.cloudinary.com/finder-net/image/upload/v1/avatars/default-avatar.png',
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT DEFAULT NULL,
  reset_password_token TEXT DEFAULT NULL,
  reset_password_expires TIMESTAMPTZ DEFAULT NULL,
  items_reported INT DEFAULT 0,
  items_recovered INT DEFAULT 0,
  reputation INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 1000),
  category TEXT NOT NULL CHECK (category IN (
    'Electronics', 'Clothing', 'Accessories', 'Documents', 'Bags',
    'Jewelry', 'Keys', 'Pets', 'Sports Equipment', 'Books',
    'Wallets', 'Mobile Phones', 'Laptops', 'Watches', 'Other'
  )),
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'matched', 'recovered', 'closed'
  )),
  images JSONB DEFAULT '[]'::jsonb,
  location JSONB NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  time TEXT DEFAULT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_email TEXT DEFAULT NULL,
  contact_phone TEXT DEFAULT NULL,
  ai_feature_vector FLOAT8[] DEFAULT NULL,
  qr_code TEXT DEFAULT NULL,
  verification_code TEXT DEFAULT NULL,
  views INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  admin_notes TEXT DEFAULT NULL,
  recovered_at TIMESTAMPTZ DEFAULT NULL,
  recovered_by UUID REFERENCES users(id) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ITEM MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS item_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  matched_item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  similarity_score FLOAT NOT NULL DEFAULT 0 CHECK (similarity_score BETWEEN 0 AND 1),
  matched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_item UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  closed_at TIMESTAMPTZ DEFAULT NULL,
  closed_by UUID REFERENCES users(id) DEFAULT NULL,
  last_message_content TEXT DEFAULT NULL,
  last_message_timestamp TIMESTAMPTZ DEFAULT NULL,
  last_message_sender UUID REFERENCES users(id) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHAT PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(chat_id, user_id)
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGE READS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'match_found', 'item_approved', 'item_rejected',
    'new_message', 'item_recovered', 'status_update', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_item UUID REFERENCES items(id) DEFAULT NULL,
  related_chat UUID REFERENCES chats(id) DEFAULT NULL,
  link TEXT DEFAULT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ DEFAULT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_items_type_status_category ON items(type, status, category);
CREATE INDEX IF NOT EXISTS idx_items_uploaded_by ON items(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_items_location_city ON items((location->>'city'));
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_search ON items USING GIN (to_tsvector('english', title || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_item_matches_item_id ON item_matches(item_id);
CREATE INDEX IF NOT EXISTS idx_item_matches_matched_item_id ON item_matches(matched_item_id);

CREATE INDEX IF NOT EXISTS idx_chat_participants_chat ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_related_item ON chats(related_item);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables (optional - configure as needed)
-- ============================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
