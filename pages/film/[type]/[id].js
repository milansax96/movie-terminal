import {useState, useEffect} from 'react';
import ReactPlayer from 'react-player';
import Header from "../../../components/Header";
import {Spotify} from 'react-spotify-embed';
import Image from "next/image";
import {Music, Heart} from 'lucide-react';
import CastSkeleton from '../../../components/skeletons/CastSkeleton';
import ProvidersSkeleton from '../../../components/skeletons/ProvidersSkeleton';

export default function Film({ movieDetails, movieName, mediaType }) {
    const BASE_URL = 'https://image.tmdb.org/t/p/original'
    const title = movieDetails.title || movieDetails.name;
    const releaseDate = movieDetails.release_date || movieDetails.first_air_date;

    // State for lazy-loaded data
    const [trailerVideo, setTrailerVideo] = useState(null);
    const [cast, setCast] = useState([]);
    const [providers, setProviders] = useState(null);
    const [soundtrackUrl, setSoundtrackUrl] = useState(null);
    const [saved, setSaved] = useState(null);

    // Loading states
    const [loadingVideos, setLoadingVideos] = useState(true);
    const [loadingCast, setLoadingCast] = useState(true);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [loadingSoundtrack, setLoadingSoundtrack] = useState(true);

    const toggleSave = async () => {
        const method = saved ? 'DELETE' : 'POST'
        const res = await fetch('/api/movies/save', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                movie_id: movieDetails.id,
                title: title,
                poster_path: movieDetails.poster_path,
                backdrop_path: movieDetails.backdrop_path,
                media_type: mediaType
            })
        })
        if (res.ok) setSaved(!saved)
    }

    const findTrailerVideo = (videoResults) => {
        if (videoResults.results?.length > 0) {
            const trailers = videoResults.results.filter(
                entry => entry.name.toLowerCase().includes('trailer')
            );
            return trailers[trailers.length - 1] || null;
        }
        return null;
    }

    // Fetch deferred data after mount (Phase 3: Client-side lazy loading)
    useEffect(() => {
        const movieId = movieDetails.id;

        // Fetch all deferred data in parallel
        Promise.all([
            fetch(`/api/movies/${movieId}/videos?media_type=${mediaType}`).then(r => r.json()),
            fetch(`/api/movies/${movieId}/credits?media_type=${mediaType}`).then(r => r.json()),
            fetch(`/api/movies/${movieId}/providers?media_type=${mediaType}`).then(r => r.json()),
            fetch(`/api/movies/${movieId}/soundtrack?name=${encodeURIComponent(movieName)}&media_type=${mediaType}`).then(r => r.json()),
            fetch(`/api/movies/${movieId}/saved`).then(r => r.json())
        ]).then(([videosData, creditsData, providersData, soundtrackData, savedData]) => {
            // Process videos
            setTrailerVideo(findTrailerVideo(videosData));
            setLoadingVideos(false);

            // Process cast
            setCast(creditsData.cast?.slice(0, 6) || []);
            setLoadingCast(false);

            // Process providers
            setProviders(providersData.results?.US || null);
            setLoadingProviders(false);

            // Process soundtrack
            setSoundtrackUrl(soundtrackData.url || null);
            setLoadingSoundtrack(false);

            // Process saved status
            setSaved(savedData.saved);
        }).catch(error => {
            console.error('Error loading deferred data:', error);
            // Mark all as loaded even on error to hide skeletons
            setLoadingVideos(false);
            setLoadingCast(false);
            setLoadingProviders(false);
            setLoadingSoundtrack(false);
        });
    }, [movieDetails.id, mediaType, movieName])

    return (
        <div>
            <Header />

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 1s ease-in;
                }
            `}</style>

            {/* Hero Banner - Backdrop image that fades to trailer */}
            <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
                {/* Backdrop Image - Always visible initially, fades out when trailer loads */}
                {movieDetails.backdrop_path && (
                    <div
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                            trailerVideo && !loadingVideos ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                        <Image
                            fill
                            className="object-cover"
                            src={`${BASE_URL}${movieDetails.backdrop_path}`}
                            alt={title}
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111111]" />
                    </div>
                )}

                {/* Trailer Video - Fades in when loaded */}
                {trailerVideo && !loadingVideos && (
                    <div className="absolute inset-0 animate-fadeIn">
                        <ReactPlayer
                            width='100%'
                            height='100%'
                            url={`https://youtube.com/watch?v=${trailerVideo.key}`}
                            playing
                            volume={1}
                            controls
                            config={{
                                youtube: {
                                    playerVars: {
                                        autoplay: 1,
                                        modestbranding: 1,
                                        rel: 0
                                    }
                                }
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111111] pointer-events-none" />
                    </div>
                )}

                {/* Title overlay - Always visible */}
                <div className="absolute bottom-4 left-6 z-20">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">{title}</h1>
                    {movieDetails.tagline && (
                        <p className="text-gray-300 italic mt-1 drop-shadow-md">{movieDetails.tagline}</p>
                    )}
                    <p className="text-gray-400 text-sm mt-1 drop-shadow-md">
                        {releaseDate?.substring(0, 4)}
                        {movieDetails.runtime
                            ? ` · ${movieDetails.runtime} min`
                            : movieDetails.episode_run_time?.[0]
                                ? ` · ${movieDetails.episode_run_time[0]} min/ep`
                                : null
                        }
                    </p>
                    {saved !== null && (
                        <button
                            onClick={toggleSave}
                            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 backdrop-blur-sm border border-gray-700 hover:border-[#e50914] transition cursor-pointer group">
                            <Heart className={`h-4 w-4 ${saved ? 'text-[#e50914]' : 'text-gray-400 group-hover:text-[#e50914]'}`} fill={saved ? 'currentColor' : 'none'} />
                            <span className={`text-sm ${saved ? 'text-[#e50914]' : 'text-gray-400 group-hover:text-white'}`}>
                                {saved ? 'Saved' : 'My Movies'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Info Row: Poster + Rating | Genres + Overview */}
            <div className="flex flex-col xl:flex-row gap-6 px-6 mt-6 relative z-10">
                <div className="flex-shrink-0">
                    {movieDetails.poster_path && (
                        <Image
                            width={200}
                            height={300}
                            src={`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`}
                            alt={title}
                            className="rounded-lg shadow-lg"
                        />
                    )}
                    {movieDetails.vote_average > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-yellow-400 text-lg font-semibold">
                            <span>{movieDetails.vote_average.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">/ 10</span>
                            <span className="text-gray-500 text-xs ml-1">({movieDetails.vote_count?.toLocaleString()} votes)</span>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {movieDetails.genres?.map(g => (
                            <span key={g.id} className="px-3 py-1 bg-[#1e1e1e] border border-gray-700 rounded-full text-sm text-gray-300">
                                {g.name}
                            </span>
                        ))}
                    </div>
                    <p className="text-gray-400 leading-relaxed">{movieDetails.overview}</p>
                </div>
            </div>

            {/* Cast Row - Lazy Loaded */}
            {loadingCast ? (
                <div className="px-6">
                    <CastSkeleton />
                </div>
            ) : cast.length > 0 ? (
                <div className="px-6 mt-6">
                    <h3 className="text-white text-lg font-semibold mb-3">Cast</h3>
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide">
                        {cast.map(member => (
                            <div key={member.id} className="flex-shrink-0 w-24 text-center">
                                {member.profile_path ? (
                                    <Image
                                        width={96}
                                        height={144}
                                        src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                                        alt={member.name}
                                        className="rounded-lg"
                                    />
                                ) : (
                                    <div className="w-24 h-36 bg-gray-700 rounded-lg" />
                                )}
                                <p className="text-gray-400 text-xs mt-1 truncate">{member.name}</p>
                                <p className="text-gray-600 text-xs truncate">{member.character}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Streaming Providers - Lazy Loaded */}
            {loadingProviders ? (
                <div className="px-6">
                    <ProvidersSkeleton />
                </div>
            ) : providers && (providers.flatrate || providers.rent || providers.buy) ? (
                <div className="px-6 mt-6">
                    <h3 className="text-white text-lg font-semibold mb-3">Watch</h3>
                    <div className="flex flex-wrap gap-3">
                        {[...(providers.flatrate || []), ...(providers.rent || []), ...(providers.buy || [])]
                            .filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i)
                            .map(provider => (
                                <div key={provider.provider_id} className="flex flex-col items-center">
                                    <Image
                                        width={45}
                                        height={45}
                                        src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                        alt={provider.provider_name}
                                        className="rounded-md"
                                    />
                                    <p className="text-gray-500 text-xs mt-1 text-center max-w-[60px] truncate">{provider.provider_name}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            ) : null}

            {/* Soundtrack - Lazy Loaded */}
            {loadingSoundtrack ? null : soundtrackUrl ? (
                <div className="px-6 mt-6 pb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-[#1db954]" fill="currentColor" />
                        <span className="text-white text-xs font-semibold tracking-widest uppercase">Soundtrack</span>
                    </div>
                    <Spotify link={soundtrackUrl} />
                </div>
            ) : null}

        </div>
    );
}

export async function getServerSideProps(context) {
    const { getCachedMovieData, cacheMovieData } = require('../../../utils/cache');

    const id = context.params.id; // Get ID from URL path
    const type = context.params.type; // Get type from URL path (movie or tv)
    const API_KEY = process.env.API_KEY;

    // Validate type parameter
    if (type !== 'movie' && type !== 'tv') {
        return {
            notFound: true
        };
    }

    try {
        // Phase 2: Only fetch CRITICAL data server-side with caching
        // Check cache first (24 hour TTL)
        let movieDetails;
        const cached = await getCachedMovieData(id, type, 24);

        if (cached && cached.details) {
            // Cache HIT - use cached data
            console.log(`[SSR] ${type} ${id} details - Cache HIT`);
            movieDetails = cached.details;
        } else {
            // Cache MISS - fetch from TMDB
            console.log(`[SSR] ${type} ${id} details - Cache MISS, fetching from TMDB`);
            const response = await fetch(
                `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch ${type} details`);
            }

            movieDetails = await response.json();

            // Cache the details (fire-and-forget to not block response)
            cacheMovieData(id, type, { details: movieDetails }).catch(console.error);
        }

        // Use movie/show title from details if name not provided in query
        const movieName = context.query.name || movieDetails.title || movieDetails.name;

        return {
            props: {
                movieDetails: movieDetails,
                movieName: movieName,
                mediaType: type
            }
        };
    } catch (error) {
        console.error('[SSR] Error in getServerSideProps:', error);
        return {
            notFound: true
        };
    }
}
