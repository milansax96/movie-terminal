const supabase = require('./supabase');

// ============================================
// Spotify Token Caching
// ============================================

/**
 * Get a valid Spotify access token (from cache or fetch new one)
 * Eliminates 300-500ms token fetch on 99% of requests
 * @returns {Promise<string>} Valid Spotify access token
 */
async function getSpotifyToken() {
  try {
    // Step 1: Check cache for valid token
    const { data: cachedToken, error: fetchError } = await supabase
      .from('spotify_tokens')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (!fetchError && cachedToken) {
      console.log('[Cache] Spotify token HIT');
      return cachedToken.access_token;
    }

    // Step 2: Cache miss - fetch new token from Spotify
    console.log('[Cache] Spotify token MISS - fetching new token');
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
    }).then((res) => res.json());

    if (!tokenResponse.access_token) {
      throw new Error('Failed to fetch Spotify token');
    }

    // Step 3: Cache token with 55-minute TTL (3300s, 5min buffer from 3600s expiry)
    const expiresAt = new Date(Date.now() + 3300 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from('spotify_tokens')
      .insert({
        access_token: tokenResponse.access_token,
        token_type: tokenResponse.token_type,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.warn('[Cache] Failed to cache Spotify token:', insertError);
      // Still return the token even if caching failed
    }

    return tokenResponse.access_token;
  } catch (error) {
    console.error('[Cache] Error in getSpotifyToken:', error);
    throw error;
  }
}

// ============================================
// TMDB Movie Data Caching
// ============================================

/**
 * Get cached movie data from Supabase
 * @param {number} movieId - TMDB movie/TV ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} maxAgeHours - Maximum age in hours (default: 24)
 * @returns {Promise<object|null>} Cached data or null if cache miss
 */
async function getCachedMovieData(movieId, mediaType, maxAgeHours = 24) {
  try {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('movie_cache')
      .select('*')
      .eq('movie_id', movieId)
      .eq('media_type', mediaType)
      .gte('cached_at', cutoffTime)
      .single();

    if (error || !data) {
      console.log(`[Cache] Movie ${movieId} (${mediaType}) MISS`);
      return null;
    }

    console.log(`[Cache] Movie ${movieId} (${mediaType}) HIT`);
    return {
      details: data.details,
      videos: data.videos,
      credits: data.credits,
      providers: data.providers,
      cachedAt: data.cached_at,
    };
  } catch (error) {
    console.error('[Cache] Error in getCachedMovieData:', error);
    return null;
  }
}

/**
 * Cache movie data in Supabase
 * @param {number} movieId - TMDB movie/TV ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {object} data - Data to cache (details, videos, credits, providers)
 * @returns {Promise<void>}
 */
async function cacheMovieData(movieId, mediaType, data) {
  try {
    const { error } = await supabase
      .from('movie_cache')
      .upsert(
        {
          movie_id: movieId,
          media_type: mediaType,
          details: data.details || null,
          videos: data.videos || null,
          credits: data.credits || null,
          providers: data.providers || null,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'movie_id,media_type' }
      );

    if (error) {
      console.error('[Cache] Error caching movie data:', error);
    } else {
      console.log(`[Cache] Movie ${movieId} (${mediaType}) cached successfully`);
    }
  } catch (error) {
    console.error('[Cache] Error in cacheMovieData:', error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Update specific fields in movie cache (partial update)
 * @param {number} movieId - TMDB movie/TV ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {object} updates - Fields to update (e.g., { videos: {...} })
 * @returns {Promise<void>}
 */
async function updateMovieCacheFields(movieId, mediaType, updates) {
  try {
    // First check if entry exists
    const { data: existing } = await supabase
      .from('movie_cache')
      .select('*')
      .eq('movie_id', movieId)
      .eq('media_type', mediaType)
      .single();

    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('movie_cache')
        .update({
          ...updates,
          cached_at: new Date().toISOString(),
        })
        .eq('movie_id', movieId)
        .eq('media_type', mediaType);

      if (error) {
        console.error('[Cache] Error updating movie cache:', error);
      }
    } else {
      // Create new entry with partial data
      await cacheMovieData(movieId, mediaType, updates);
    }
  } catch (error) {
    console.error('[Cache] Error in updateMovieCacheFields:', error);
  }
}

// ============================================
// Soundtrack Caching
// ============================================

/**
 * Get cached soundtrack URL
 * @param {number} movieId - TMDB movie/TV ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<string|null>} Soundtrack URL or null if cache miss
 */
async function getCachedSoundtrack(movieId, mediaType) {
  try {
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const { data, error } = await supabase
      .from('soundtrack_cache')
      .select('*')
      .eq('movie_id', movieId)
      .eq('media_type', mediaType)
      .gte('cached_at', cutoffTime)
      .single();

    if (error || !data) {
      console.log(`[Cache] Soundtrack ${movieId} (${mediaType}) MISS`);
      return null;
    }

    console.log(`[Cache] Soundtrack ${movieId} (${mediaType}) HIT`);
    return data.soundtrack_url;
  } catch (error) {
    console.error('[Cache] Error in getCachedSoundtrack:', error);
    return null;
  }
}

/**
 * Cache soundtrack URL
 * @param {number} movieId - TMDB movie/TV ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {string} movieName - Movie/TV show name
 * @param {string} soundtrackUrl - Best matched Spotify URL
 * @param {object} spotifyResponse - Full Spotify response (optional)
 * @returns {Promise<void>}
 */
async function cacheSoundtrack(movieId, mediaType, movieName, soundtrackUrl, spotifyResponse = null) {
  try {
    const { error } = await supabase
      .from('soundtrack_cache')
      .upsert(
        {
          movie_id: movieId,
          media_type: mediaType,
          movie_name: movieName,
          soundtrack_url: soundtrackUrl,
          spotify_response: spotifyResponse,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'movie_id,media_type' }
      );

    if (error) {
      console.error('[Cache] Error caching soundtrack:', error);
    } else {
      console.log(`[Cache] Soundtrack ${movieId} (${mediaType}) cached successfully`);
    }
  } catch (error) {
    console.error('[Cache] Error in cacheSoundtrack:', error);
  }
}

// ============================================
// Cache Cleanup
// ============================================

/**
 * Clean up expired cache entries
 * @returns {Promise<object>} Cleanup statistics
 */
async function cleanupExpiredCache() {
  try {
    const stats = {
      spotifyTokens: 0,
      movieCache: 0,
      soundtrackCache: 0,
      errors: [],
    };

    // Clean expired Spotify tokens
    const { error: spotifyError, count: spotifyCount } = await supabase
      .from('spotify_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (spotifyError) {
      stats.errors.push({ table: 'spotify_tokens', error: spotifyError });
    } else {
      stats.spotifyTokens = spotifyCount || 0;
    }

    // Clean old movie cache entries (older than 24 hours)
    const movieCacheCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { error: movieError, count: movieCount } = await supabase
      .from('movie_cache')
      .delete()
      .lt('cached_at', movieCacheCutoff);

    if (movieError) {
      stats.errors.push({ table: 'movie_cache', error: movieError });
    } else {
      stats.movieCache = movieCount || 0;
    }

    // Clean old soundtrack cache entries (older than 7 days)
    const soundtrackCacheCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error: soundtrackError, count: soundtrackCount } = await supabase
      .from('soundtrack_cache')
      .delete()
      .lt('cached_at', soundtrackCacheCutoff);

    if (soundtrackError) {
      stats.errors.push({ table: 'soundtrack_cache', error: soundtrackError });
    } else {
      stats.soundtrackCache = soundtrackCount || 0;
    }

    console.log('[Cache] Cleanup completed:', stats);
    return stats;
  } catch (error) {
    console.error('[Cache] Error in cleanupExpiredCache:', error);
    throw error;
  }
}

// ============================================
// Cache Statistics
// ============================================

/**
 * Get cache statistics (number of entries, size, etc.)
 * @returns {Promise<object>} Cache statistics
 */
async function getCacheStats() {
  try {
    const stats = {
      spotifyTokens: 0,
      movieCache: 0,
      soundtrackCache: 0,
      errors: [],
    };

    // Count Spotify tokens
    const { count: spotifyCount, error: spotifyError } = await supabase
      .from('spotify_tokens')
      .select('*', { count: 'exact', head: true });

    if (!spotifyError) {
      stats.spotifyTokens = spotifyCount || 0;
    }

    // Count movie cache entries
    const { count: movieCount, error: movieError } = await supabase
      .from('movie_cache')
      .select('*', { count: 'exact', head: true });

    if (!movieError) {
      stats.movieCache = movieCount || 0;
    }

    // Count soundtrack cache entries
    const { count: soundtrackCount, error: soundtrackError } = await supabase
      .from('soundtrack_cache')
      .select('*', { count: 'exact', head: true });

    if (!soundtrackError) {
      stats.soundtrackCache = soundtrackCount || 0;
    }

    return stats;
  } catch (error) {
    console.error('[Cache] Error in getCacheStats:', error);
    return null;
  }
}

module.exports = {
  // Spotify token caching
  getSpotifyToken,

  // Movie data caching
  getCachedMovieData,
  cacheMovieData,
  updateMovieCacheFields,

  // Soundtrack caching
  getCachedSoundtrack,
  cacheSoundtrack,

  // Maintenance
  cleanupExpiredCache,
  getCacheStats,
};
