import { fetchGames } from '@/lib/wordpress/client'
import { GamesGrid } from '@/components/games/GamesGrid'

export const metadata = {
  title: 'Games | jazzsequence',
  description: 'My board game collection.',
}

export default async function GamesPage() {
  const games = await fetchGames({ isr: { revalidate: 3600, tags: ['gc_game'] } })

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Games</h1>
      <p className="text-gray-500 mb-8">
        My board game collection — {games.length} games and counting.
      </p>
      <GamesGrid games={games} />
    </main>
  )
}
