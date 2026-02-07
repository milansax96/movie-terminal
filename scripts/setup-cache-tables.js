const supabase = require('../utils/supabase');

async function setupCacheTables() {
  console.log('Setting up cache tables in Supabase...');

  try {
    // Create spotify_tokens table
    console.log('\n1. Creating spotify_tokens table...');
    const { error: tokenTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS spotify_tokens (
          id SERIAL PRIMARY KEY,
          access_token TEXT NOT NULL,
          token_type TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_spotify_tokens_expires
        ON spotify_tokens(expires_at)
        WHERE expires_at > NOW();
      `
    });

    if (tokenTableError) {
      console.error('Error creating spotify_tokens table:', tokenTableError);
      // Try alternative approach using SQL editor
      console.log('Please run the following SQL in Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS spotify_tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spotify_tokens_expires
ON spotify_tokens(expires_at)
WHERE expires_at > NOW();
      `);
    } else {
      console.log('✓ spotify_tokens table created successfully');
    }

    // Create movie_cache table
    console.log('\n2. Creating movie_cache table...');
    const { error: movieCacheError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS movie_cache (
          movie_id INTEGER NOT NULL,
          media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
          details JSONB NOT NULL,
          videos JSONB,
          credits JSONB,
          providers JSONB,
          cached_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (movie_id, media_type)
        );

        CREATE INDEX IF NOT EXISTS idx_movie_cache_cached_at
        ON movie_cache(cached_at);
      `
    });

    if (movieCacheError) {
      console.error('Error creating movie_cache table:', movieCacheError);
      console.log('Please run the following SQL in Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS movie_cache (
  movie_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  details JSONB NOT NULL,
  videos JSONB,
  credits JSONB,
  providers JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (movie_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_movie_cache_cached_at
ON movie_cache(cached_at);
      `);
    } else {
      console.log('✓ movie_cache table created successfully');
    }

    // Create soundtrack_cache table
    console.log('\n3. Creating soundtrack_cache table...');
    const { error: soundtrackCacheError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS soundtrack_cache (
          movie_id INTEGER NOT NULL,
          media_type TEXT NOT NULL,
          movie_name TEXT NOT NULL,
          soundtrack_url TEXT,
          spotify_response JSONB,
          cached_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (movie_id, media_type)
        );

        CREATE INDEX IF NOT EXISTS idx_soundtrack_cache_cached_at
        ON soundtrack_cache(cached_at);
      `
    });

    if (soundtrackCacheError) {
      console.error('Error creating soundtrack_cache table:', soundtrackCacheError);
      console.log('Please run the following SQL in Supabase SQL Editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS soundtrack_cache (
  movie_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  soundtrack_url TEXT,
  spotify_response JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (movie_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_soundtrack_cache_cached_at
ON soundtrack_cache(cached_at);
      `);
    } else {
      console.log('✓ soundtrack_cache table created successfully');
    }

    console.log('\n✅ All cache tables setup complete!');
    console.log('\nTo manually run these migrations, copy the SQL above into Supabase SQL Editor.');

  } catch (error) {
    console.error('\nError during setup:', error);
    console.log('\n📋 Manual SQL Migration Script:');
    console.log('='.repeat(60));
    console.log(`
-- Table 1: Spotify Tokens Cache
CREATE TABLE IF NOT EXISTS spotify_tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spotify_tokens_expires
ON spotify_tokens(expires_at)
WHERE expires_at > NOW();

-- Table 2: Movie Cache (TMDB data)
CREATE TABLE IF NOT EXISTS movie_cache (
  movie_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  details JSONB NOT NULL,
  videos JSONB,
  credits JSONB,
  providers JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (movie_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_movie_cache_cached_at
ON movie_cache(cached_at);

-- Table 3: Soundtrack Cache
CREATE TABLE IF NOT EXISTS soundtrack_cache (
  movie_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  soundtrack_url TEXT,
  spotify_response JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (movie_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_soundtrack_cache_cached_at
ON soundtrack_cache(cached_at);
    `);
    console.log('='.repeat(60));
    console.log('\nCopy the SQL above and run it in your Supabase SQL Editor:');
    console.log('https://app.supabase.com/project/_/sql');
  }
}

// Run the setup
setupCacheTables()
  .then(() => {
    console.log('\nSetup script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSetup failed:', error);
    process.exit(1);
  });
