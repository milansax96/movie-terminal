const supabase = require('../../../../utils/supabase');
const { getToken } = require('next-auth/jwt');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }

  try {
    // Check authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      // Not authenticated - return null
      return res.status(200).json({ saved: null });
    }

    // Check if movie is in user's saved list
    const { data, error } = await supabase
      .from('saved_movies')
      .select('id')
      .eq('user_email', token.email)
      .eq('movie_id', id)
      .single();

    if (error) {
      // Not found or other error
      return res.status(200).json({ saved: false });
    }

    return res.status(200).json({ saved: !!data });
  } catch (error) {
    console.error('[API] Error checking saved status:', error);
    return res.status(500).json({ error: 'Failed to check saved status' });
  }
}
