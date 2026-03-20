import { fetchGames, fetchMenuItems } from '@/lib/wordpress/client'
import { GamesGrid } from '@/components/games/GamesGrid'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Games | jazzsequence',
  description: 'My board game collection.',
}

export default async function GamesPage() {
  const [games, menuItems] = await Promise.allSettled([
    fetchGames({ isr: { revalidate: 3600, tags: ['gc_game'] } }),
    fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
  ])

  const gamesData = games.status === 'fulfilled' ? games.value : []
  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text mb-2">Games</h1>
        <p className="text-brand-muted mb-8">
          My board game collection — {gamesData.length} games and counting.
        </p>
        <GamesGrid games={gamesData} />
      </main>
      <Footer />
    </>
  )
}
