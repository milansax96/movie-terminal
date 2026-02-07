const { getSpotifyToken, getCachedSoundtrack, cacheSoundtrack } = require('../../../../utils/cache');

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Score soundtrack candidate based on name matching and release year
 * (Copied from pages/film.js for consistency)
 */
function scoreSoundtrackCandidate(candidate, movieTitle, movieYear) {
  const name = candidate.name.toLowerCase();
  const title = movieTitle.toLowerCase();

  if (!name.includes(title)) return -Infinity;

  let score = 0;

  if (name.includes('soundtrack')) score += 100;
  if (name.includes('motion picture')) score += 90;
  if (name.includes('original score')) score += 80;

  if (candidate.release_date && movieYear) {
    const albumYear = parseInt(candidate.release_date.substring(0, 4), 10);
    const diff = Math.abs(albumYear - parseInt(movieYear, 10));
    if (diff === 0) score += 50;
    else if (diff === 1) score += 30;
    else if (diff <= 3) score += 10;
  }

  return score;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { name, media_type } = req.query;

  if (!id || !name || !media_type) {
    return res.status(400).json({ error: 'Missing required parameters: id, name, media_type' });
  }

  try {
    // Check cache first (7 day TTL)
    const cachedUrl = await getCachedSoundtrack(id, media_type);

    if (cachedUrl !== null) {
      console.log(`[API] Soundtrack for ${id} - Cache HIT`);
      return res.status(200).json({ url: cachedUrl });
    }

    // Cache miss - fetch movie details for release year
    console.log(`[API] Soundtrack for ${id} - Cache MISS, fetching from TMDB and Spotify`);

    // Get movie release year
    const detailsResponse = await fetch(
      `${BASE_URL}/${media_type}/${id}?api_key=${API_KEY}`
    ).then((r) => r.json());

    const releaseDate = detailsResponse.release_date || detailsResponse.first_air_date;
    const movieYear = releaseDate ? releaseDate.substring(0, 4) : null;

    // Get Spotify token (cached)
    const spotifyToken = await getSpotifyToken();

    // Search Spotify for soundtrack
    const searchQuery = encodeURIComponent(`${name} soundtrack`);
    const spotifyResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${searchQuery}&type=album,playlist&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    ).then((r) => r.json());

    // Score all candidates
    const candidates = [
      ...(spotifyResponse.albums?.items || []),
      ...(spotifyResponse.playlists?.items || []),
    ].filter(Boolean);

    let soundtrackUrl = null;
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      const score = scoreSoundtrackCandidate(candidate, name, movieYear);
      if (score > bestScore) {
        bestScore = score;
        soundtrackUrl = candidate.external_urls?.spotify || null;
      }
    }

    if (bestScore === -Infinity) {
      soundtrackUrl = null;
    }

    // Cache the result (fire-and-forget)
    cacheSoundtrack(id, media_type, name, soundtrackUrl, spotifyResponse).catch(console.error);

    return res.status(200).json({ url: soundtrackUrl });
  } catch (error) {
    console.error('[API] Error fetching soundtrack:', error);
    return res.status(500).json({ error: 'Failed to fetch soundtrack' });
  }
}
