import Image from "next/image";
import {ThumbsUp} from 'lucide-react';
import {forwardRef} from 'react';
import {useRouter} from 'next/router';


// eslint-disable-next-line react/display-name
const Thumbnail = forwardRef(({ result }, ref) => {
    const router = useRouter();
    const BASE_URL = 'https://image.tmdb.org/t/p/original'
    return (
        <div
            onClick={() => router.push({
                pathname: '/film',
                query: {id: result.id, name: result.title || result.name, poster_path: result.poster_path, media_type: result.media_type},
                asPath: `/film/${result.id}`
            })}
            ref={ref}
            className='group cursor-pointer transition duration-300 ease-in transform sm:hover:scale-105 hover:z-50
            rounded-lg overflow-hidden border border-transparent hover:border-[#e50914] hover:shadow-lg hover:shadow-[#e50914]/20'>
            <div className="relative aspect-video">
                <Image
                    layout='fill'
                    objectFit='cover'
                    src={`${BASE_URL}${result.backdrop_path || result.poster_path}` || `${BASE_URL}${result.poster_path}`}
                    alt='/image'
                />
                {result.vote_average > 0 && (
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-yellow-400 text-sm font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                        {result.vote_average.toFixed(1)}
                        <span className="text-yellow-300">&#9733;</span>
                    </div>
                )}
            </div>

            <div className='p-3 bg-[#1e1e1e]'>
                <h2 className='text-sm text-white font-medium truncate group-hover:text-[#e50914] transition duration-200'>
                    {result.title || result.original_name}
                </h2>
                <p className='flex items-center text-xs text-gray-500 mt-0.5'>
                    {result.media_type && `${result.media_type} · `}
                    {result.release_date || result.first_air_date}{" "}
                    <ThumbsUp className="h-3.5 w-3.5 mx-1.5 text-gray-600" strokeWidth={1.5}/>{result.vote_count}
                </p>
            </div>
        </div>
    )
})

export default Thumbnail
