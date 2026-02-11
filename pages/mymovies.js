import { useState } from 'react'
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import supabase from '../utils/supabase'

export default function MyMovies({ savedMovies: initialMovies }) {
    const router = useRouter()
    const [movies, setMovies] = useState(initialMovies)
    const BASE_URL = 'https://image.tmdb.org/t/p/original'

    const unsave = async (movieId) => {
        const res = await fetch('/api/movies/save', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie_id: movieId })
        })
        if (res.ok) {
            setMovies(prev => prev.filter(m => m.movie_id !== movieId))
        }
    }

    return (
        <div className="min-h-screen bg-[#111111]">
            <Header />
            <div className="px-6 pt-6">
                <h1 className="text-2xl font-bold text-white mb-6">My Movies</h1>
                {movies.length === 0 ? (
                    <div className="text-center mt-24">
                        <Heart className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500">No saved movies yet.</p>
                        <p className="text-gray-600 text-sm mt-1">Browse movies and click the heart to save them here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {movies.map(movie => (
                            <div
                                key={movie.movie_id}
                                className="group relative transition duration-300 ease-in transform sm:hover:scale-105 hover:z-50
                                rounded-lg overflow-hidden border border-transparent hover:border-[#e50914] hover:shadow-lg hover:shadow-[#e50914]/20"
                            >
                                <div
                                    onClick={() => router.push(`/film/${movie.media_type}/${movie.movie_id}`)}
                                    className="relative aspect-video cursor-pointer"
                                >
                                    <Image
                                        fill
                                        className="object-cover"
                                        src={`${BASE_URL}${movie.backdrop_path || movie.poster_path}`}
                                        alt={movie.title}
                                    />
                                </div>
                                <button
                                    onClick={() => unsave(movie.movie_id)}
                                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition hover:bg-opacity-80"
                                >
                                    <Heart className="h-4 w-4 text-[#e50914]" fill="currentColor" />
                                </button>
                                <div
                                    onClick={() => router.push(`/film/${movie.media_type}/${movie.movie_id}`)}
                                    className="p-3 bg-[#1e1e1e] cursor-pointer"
                                >
                                    <h2 className="text-sm text-white font-medium truncate group-hover:text-[#e50914] transition duration-200">
                                        {movie.title}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {movie.media_type}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export async function getServerSideProps(context) {
    const session = await getSession(context)
    if (!session) {
        return { redirect: { destination: '/auth', permanent: false } }
    }

    const { data } = await supabase
        .from('saved_movies')
        .select('*')
        .eq('user_email', session.user.email)
        .order('added_at', { ascending: false })

    return {
        props: {
            savedMovies: data || []
        }
    }
}
