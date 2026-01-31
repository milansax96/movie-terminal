import {useState, useEffect} from 'react';
import ReactPlayer from 'react-player';
import Header from "../components/Header";
import {Spotify} from 'react-spotify-embed';
import songRequests from "../utils/songRequests";
import Image from "next/image";
import {Play, Music} from 'lucide-react';

function scoreSoundtrackCandidate(candidate, movieTitle, movieYear) {
    const name = candidate.name.toLowerCase();
    const title = movieTitle.toLowerCase();

    if (!name.includes(title)) return -Infinity;

    let score = 0;

    if (name.includes('soundtrack'))     score += 100;
    if (name.includes('motion picture')) score += 90;
    if (name.includes('original score')) score += 80;

    if (candidate.release_date && movieYear) {
        const albumYear = parseInt(candidate.release_date.substring(0, 4), 10);
        const diff = Math.abs(albumYear - parseInt(movieYear, 10));
        if (diff === 0)    score += 50;
        else if (diff === 1) score += 30;
        else if (diff <= 3)  score += 10;
    }

    return score;
}

export default function Film({ videoResults, movieDetails, soundtrackUrl, cast, providers }) {
    const BASE_URL = 'https://image.tmdb.org/t/p/original'
    const [trailerVideo, setTrailerVideo] = useState(null);
    const title = movieDetails.title || movieDetails.name;
    const releaseDate = movieDetails.release_date || movieDetails.first_air_date;

    const findTrailerVideo = () => {
        if (videoResults.results?.length > 0) {
            const trailers = videoResults.results.filter(
                entry => entry.name.toLowerCase().includes('trailer')
            );
            return trailers[trailers.length - 1] || null;
        }
        return null;
    }

    useEffect(() => {
        setTrailerVideo(findTrailerVideo());
    }, [])

    return (
        <div>
            <Header />

            {/* Hero Banner */}
            {movieDetails.backdrop_path && (
                <div className="relative w-full h-64 sm:h-96">
                    <Image
                        layout="fill"
                        objectFit="cover"
                        src={`${BASE_URL}${movieDetails.backdrop_path}`}
                        alt={title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#111111]" />
                    <div className="absolute bottom-4 left-6 z-10">
                        <h1 className="text-4xl sm:text-5xl font-bold text-white">{title}</h1>
                        {movieDetails.tagline && (
                            <p className="text-gray-400 italic mt-1">{movieDetails.tagline}</p>
                        )}
                        <p className="text-gray-500 text-sm mt-1">
                            {releaseDate?.substring(0, 4)}
                            {movieDetails.runtime
                                ? ` · ${movieDetails.runtime} min`
                                : movieDetails.episode_run_time?.[0]
                                    ? ` · ${movieDetails.episode_run_time[0]} min/ep`
                                    : null
                            }
                        </p>
                    </div>
                </div>
            )}

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
                    {soundtrackUrl && (
                        <div className="mt-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Music className="h-4 w-4 text-[#1db954]" fill="currentColor" />
                                <span className="text-white text-xs font-semibold tracking-widest uppercase">Soundtrack</span>
                            </div>
                            <Spotify link={soundtrackUrl} />
                        </div>
                    )}
                </div>
            </div>

            {/* Cast Row */}
            {cast.length > 0 && (
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
            )}

            {/* Streaming Providers */}
            {providers && (providers.flatrate || providers.rent || providers.buy) && (
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
            )}

            {/* Trailer */}
            {trailerVideo && (
                <div className="px-6 mt-10 pb-10">
                    <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border-t-2 border-[#e50914]">
                        <div className="flex items-center gap-2 px-4 py-3">
                            <Play className="h-5 w-5 text-[#e50914]" fill="currentColor" />
                            <h3 className="text-white text-sm font-semibold tracking-widest uppercase">Official Trailer</h3>
                        </div>
                        <div className="w-full aspect-video">
                            <ReactPlayer width='100%' height='100%' url={`https://youtube.com/watch?v=${trailerVideo.key}`} />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export async function getServerSideProps(context) {
    const id = context.query['id'];
    const name = context.query['name'];
    const poster_path = context.query['poster_path'];
    const media_type = context.query['media_type'];
    const API_KEY = process.env.API_KEY;
    const type = media_type === 'tv' ? 'tv' : 'movie';

    // Step 1: Spotify token (serial — prerequisite for the search call)
    const tokenRequest = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${songRequests['fetchSoundtrack'].clientID}&client_secret=${songRequests['fetchSoundtrack'].clientSecret}`
        }
    ).then(res => res.json());

    // Step 2: All remaining fetches in parallel
    const [detailsResponse, videosResponse, songResponse, creditsResponse, providersResponse] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=en-US`).then(res => res.json()),
        fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${API_KEY}`).then(res => res.json()),
        fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(name + ' soundtrack')}&type=album,playlist&limit=20`,
            { headers: { 'Authorization': 'Bearer ' + tokenRequest.access_token } }
        ).then(res => res.json()),
        fetch(`https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${API_KEY}`).then(res => res.json()),
        fetch(`https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${API_KEY}`).then(res => res.json()),
    ]);

    // Step 3: Score soundtrack candidates server-side
    const detailsReleaseDate = detailsResponse.release_date || detailsResponse.first_air_date;
    const movieYear = detailsReleaseDate ? detailsReleaseDate.substring(0, 4) : null;
    const candidates = [
        ...(songResponse.albums?.items || []),
        ...(songResponse.playlists?.items || [])
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
    if (bestScore === -Infinity) soundtrackUrl = null;

    return {
        props: {
            videoResults: videosResponse,
            movieDetails: detailsResponse,
            soundtrackUrl: soundtrackUrl,
            cast: creditsResponse.cast?.slice(0, 6) || [],
            providers: providersResponse.results?.US || null,
            posterPath: poster_path
        }
    }
}

