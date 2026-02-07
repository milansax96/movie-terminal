const { getCachedMovieData, updateMovieCacheFields } = require('../../../../utils/cache');

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { media_type } = req.query;

  if (!id || !media_type) {
    return res.status(400).json({ error: 'Missing required parameters: id, media_type' });
  }

  try {
    // Check cache first (24 hour TTL)
    const cached = await getCachedMovieData(id, media_type, 24);

    if (cached && cached.credits) {
      console.log(`[API] Credits for ${id} - Cache HIT`);
      return res.status(200).json(cached.credits);
    }

    // Cache miss - fetch from TMDB
    console.log(`[API] Credits for ${id} - Cache MISS, fetching from TMDB`);
    const response = await fetch(
      `${BASE_URL}/${media_type}/${id}/credits?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const credits = await response.json();

    // Update cache (fire-and-forget to not block response)
    updateMovieCacheFields(id, media_type, { credits }).catch(console.error);

    return res.status(200).json(credits);
  } catch (error) {
    console.error('[API] Error fetching credits:', error);
    return res.status(500).json({ error: 'Failed to fetch credits' });
  }
}
