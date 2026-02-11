-- ============================================
-- Saved Movies Table for User Watch Lists
-- ============================================
-- Run this script in Supabase SQL Editor
-- https://app.supabase.com/project/_/sql
-- ============================================

-- Table: saved_movies
-- Stores movies/shows that users have saved to their lists
CREATE TABLE IF NOT EXISTS saved_movies (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_email, movie_id)
);

-- Index for finding user's saved movies
CREATE INDEX IF NOT EXISTS idx_saved_movies_user_email
ON saved_movies(user_email, added_at DESC);

-- Index for checking if a specific movie is saved
CREATE INDEX IF NOT EXISTS idx_saved_movies_lookup
ON saved_movies(user_email, movie_id);

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the table was created successfully:

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'saved_movies'
ORDER BY ordinal_position;
