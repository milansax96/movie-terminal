import { useSession, signOut, getSession } from 'next-auth/react'
import Header from '../components/Header'
import Image from 'next/image'
import { LogOut, Bookmark } from 'lucide-react'
import Link from 'next/link'

export default function Account() {
    const { data: session } = useSession()

    return (
        <div className="min-h-screen bg-[#111111]">
            <Header />
            <div className="flex items-center justify-center px-4 pt-24">
                <div className="w-full max-w-md bg-[#1e1e1e] rounded-2xl shadow-xl p-8 text-center border border-gray-800">
                    {session.user?.image && (
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#e50914]">
                            <Image
                                src={session.user.image}
                                width={96}
                                height={96}
                                alt={session.user.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <h1 className="text-xl font-bold text-white">{session.user?.name}</h1>
                    <p className="text-gray-500 text-sm mt-1">{session.user?.email}</p>

                    <Link href="/mymovies" className="mt-6 w-full flex items-center justify-center gap-2 bg-[#e50914] text-white
                        font-semibold py-3 rounded-lg hover:bg-[#c4070f] transition cursor-pointer">
                        <Bookmark className="h-4 w-4" />
                        My Movies
                    </Link>

                    <button
                        onClick={() => signOut({ callbackUrl: '/auth' })}
                        className="mt-8 w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-300
                        font-semibold py-3 rounded-lg hover:bg-gray-700 hover:text-white transition border border-gray-600 cursor-pointer">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export async function getServerSideProps(context) {
    const session = await getSession(context)
    if (!session) {
        return { redirect: { destination: '/auth', permanent: false } }
    }
    return { props: { session } }
}
