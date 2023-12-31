import Image from "next/image";
import {ThumbUpIcon} from "@heroicons/react/solid";
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
                query: {id: result.id, name: result.title, poster_path: result.poster_path},
                asPath: `/film/${result.id}`
            })}
            ref={ref}
            className='p-2 group cursor-pointer transition duration-200 ease-in transform sm:hover:scale-105 hover:z-50'>
            <Image
                layout='responsive'
                height={1080}
                width={1920}
                src={`${BASE_URL}${result.backdrop_path || result.poster_path}` || `${BASE_URL}${result.poster_path}`}
                alt='/image'
            />

            <div className='p-2'>
                <p className="truncate max-w-md">{result.overview}</p>
                <h2 className='mt-1 text-2xl text-white transition-all duration-100 ease-in-out group-hover:font-bold'>
                    {result.title || result.original_name}
                </h2>
                <p className='flex items-center opacity-0 group-hover:opacity-100'>
                    {result.media_type && `${result.media_type}`}{" "}
                    {result.release_date || result.first_air_date}{" "}
                    <ThumbUpIcon className="h-5 mx-2">{result.vote_count}</ThumbUpIcon>
                </p>
            </div>
        </div>
    )
})

export default Thumbnail
