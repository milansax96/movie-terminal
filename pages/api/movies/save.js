import { getToken } from 'next-auth/jwt'
import supabase from '../../../utils/supabase'

export default async function handler(req, res) {
    const token = await getToken({ req })
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' })
    }

    const { movie_id, title, poster_path, backdrop_path, media_type } = req.body || {}

    if (req.method === 'POST') {
        const { error } = await supabase
            .from('saved_movies')
            .upsert({
                user_email: token.email,
                movie_id,
                title,
                poster_path,
                backdrop_path,
                media_type
            }, { onConflict: 'user_email,movie_id' })
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
        const { error } = await supabase
            .from('saved_movies')
            .delete()
            .match({ user_email: token.email, movie_id })
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
}
