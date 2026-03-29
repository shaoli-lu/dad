-- Dad Jokes Database Schema
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== JOKES TABLE ====================
CREATE TABLE IF NOT EXISTS jokes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  source TEXT DEFAULT 'user' CHECK (source IN ('api', 'user')),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== COMMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  joke_id UUID NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
  author_name TEXT DEFAULT 'Anonymous',
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== VOTES TABLE ====================
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  joke_id UUID NOT NULL REFERENCES jokes(id) ON DELETE CASCADE,
  voter_fingerprint TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(joke_id, voter_fingerprint)
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_jokes_approved ON jokes(is_approved);
CREATE INDEX IF NOT EXISTS idx_jokes_created_at ON jokes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jokes_upvotes ON jokes(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_comments_joke_id ON comments(joke_id);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_votes_joke_fingerprint ON votes(joke_id, voter_fingerprint);

-- ==================== ROW LEVEL SECURITY ====================
-- Enable RLS
ALTER TABLE jokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public read access for approved jokes
CREATE POLICY "Anyone can read approved jokes" ON jokes
  FOR SELECT USING (is_approved = true);

-- Allow all operations for jokes (using anon key for simplicity)
CREATE POLICY "Anyone can insert jokes" ON jokes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update jokes" ON jokes
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete jokes" ON jokes
  FOR DELETE USING (true);

-- Admin can read all jokes (including unapproved)
CREATE POLICY "Admin can read all jokes" ON jokes
  FOR SELECT USING (true);

-- Comments policies
CREATE POLICY "Anyone can read approved comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update comments" ON comments
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete comments" ON comments
  FOR DELETE USING (true);

-- Votes policies
CREATE POLICY "Anyone can read votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert votes" ON votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete votes" ON votes
  FOR DELETE USING (true);
