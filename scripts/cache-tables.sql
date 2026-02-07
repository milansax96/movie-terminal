-- ============================================
-- Cache Tables Setup for Performance Optimization
-- ============================================
-- Run this script in Supabase SQL Editor
-- https://app.supabase.com/project/_/sql
-- ============================================

-- Table 1: Spotify Tokens Cache
-- Stores Spotify API access tokens to avoid repeated OAuth requests
-- TTL: 55 minutes (managed in application code)
CREATE TABLE IF NOT EXISTS spotify_tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quickly finding valid (non-expired) tokens
-- DESC order helps find the most recent token first
CREATE INDEX IF NOT EXISTS idx_spotify_tokens_expires
ON spotify_tokens(expires_at DESC);

-- Table 2: Movie Cache (TMDB API responses)
-- Stores TMDB API responses for movies and TV shows
-- TTL: 24 hours for details/videos/credits, 6 hours for providers
CREATE TABLE IF NOT EXISTS movie_cache (
  movie_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  details JSONB NOT NULL,        -- Movie details from TMDB
  videos JSONB,                  -- Trailers and videos
  credits JSONB,                 -- Cast and crew
  providers JSONB,               -- Watch providers (streaming platforms)
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (movie_id, media_type)
);

-- Index for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_movie_cache_cached_at
ON movie_cache(cached_at);

-- Table 3: Soundtrack Cache
-- Stores Spotify soundtrack search results
-- TTL: 7 days (deterministic search results)
CREATE TABLE IF NOT EXISTS soundtrack_cache (
  movie_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  soundtrack_url TEXT,           -- Best matched Spotify URL
  spotify_response JSONB,        -- Full Spotify search response
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (movie_id, media_type)
);

-- Index for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_soundtrack_cache_cached_at
ON soundtrack_cache(cached_at);

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify tables were created successfully:

-- List all cache tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('spotify_tokens', 'movie_cache', 'soundtrack_cache');

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('spotify_tokens', 'movie_cache', 'soundtrack_cache');
