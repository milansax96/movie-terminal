import requests from '../utils/requests'
import { useRouter } from 'next/router'

function Nav() {
    const router = useRouter();
    return (
        <nav className="relative">
            <div className="flex px-6 sm:px-10 text-sm font-medium
            whitespace-nowrap space-x-6 sm:space-x-10 overflow-x-scroll scrollbar-hide">
                {Object.entries(requests).map(([key, {title, url}]) => (
                    <h2 key={key}
                        onClick={() => router.push(`/?genre=${key}`)}
                        className="last:pr-24 cursor-pointer transition duration-200 text-gray-400 pb-2
                    border-b-2 border-transparent hover:text-white hover:border-[#e50914]">{title}</h2>
                ))}
            </div>
            <div className="absolute top-0 right-0 bg-gradient-to-l from-[#111111] h-10 w-1/12"></div>
        </nav>
    )
}

export default Nav