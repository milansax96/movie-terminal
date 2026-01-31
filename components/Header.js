import HeaderItem from "./HeaderItem";
import {Home, Search, User} from 'lucide-react'
import {useRouter} from 'next/router'
import {useState} from 'react'
import { useSession } from 'next-auth/react'

function Header() {
    const router = useRouter();
    const { data: session } = useSession();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <header className="flex flex-col sm:flex-row px-6 py-4 justify-between items-center flex-wrap">
            <p className="text-3xl font-bold tracking-tight cursor-pointer" onClick={() => router.push('/')}>
                <span className="text-[#e50914]">Movie</span><span className="text-white">Terminal</span>
            </p>
            <div className='flex gap-1 mt-3 sm:mt-0'>
                <HeaderItem title="HOME" Icon={Home}/>
                <HeaderItem title="SEARCH" Icon={Search} onClick={() => setSearchOpen(!searchOpen)}/>
                {session ? (
                    <div
                        onClick={() => router.push('/account')}
                        className="flex flex-col items-center cursor-pointer group w-12 sm:w-20 hover:text-white">
                        <User className="h-8 w-8 mb-1 group-hover:animate-bounce text-[#e50914]" />
                        <p className="opacity-0 group-hover:opacity-100 tracking-widest text-xs truncate">{session.user?.name?.split(' ')[0]}</p>
                    </div>
                ) : (
                    <HeaderItem title="ACCOUNT" Icon={User} route="/auth"/>
                )}
            </div>
            {searchOpen && (
                <div className="w-full mt-3">
                    <input
                        autoFocus
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchTerm.trim()) {
                                router.push(`/?search=${encodeURIComponent(searchTerm.trim())}`);
                                setSearchOpen(false);
                                setSearchTerm('');
                            }
                        }}
                        placeholder="Search movies..."
                        className="w-full max-w-md px-4 py-2 rounded-lg bg-[#1e1e1e] text-gray-200 border border-gray-700 focus:outline-none focus:border-[#e50914] transition"
                    />
                </div>
            )}
        </header>
    )
}

export default Header