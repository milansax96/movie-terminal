import Head from 'next/head'
import Header from "../components/Header";
import Nav from "../components/Nav";
import Results from "../components/Results";
import requests from "../utils/requests";


export default function Home({ results }) {
    return (
        <div>
            <Head>
                <title>MovieTerminal</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header />
            <Nav />
            <Results results={results} />
        </div>
    )
}

export async function getServerSideProps(context) {
    const searchTerm = context.query.search;

    if (searchTerm) {
        const request = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.API_KEY}&query=${encodeURIComponent(searchTerm)}&language=en-US`
        ).then(res => res.json());

        return {
            props: {
                results: request.results || []
            }
        }
    }

    const genre = context.query.genre;

    const request = await fetch(
        `https://api.themoviedb.org/3${requests[genre]?.url || requests.fetchTrending.url}`
    ).then(res => res.json());

    return {
        props: {
            results: request.results
        }
    }
}