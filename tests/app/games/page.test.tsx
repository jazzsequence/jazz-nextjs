import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GamesPage from '@/app/games/page'
import type { GCGame } from '@/lib/wordpress/types'

vi.mock('@/lib/wordpress/client', () => ({
  fetchGames: vi.fn().mockResolvedValue([
    {
      id: 1,
      slug: 'hero-realms',
      date: '2021-01-01T00:00:00',
      title: { rendered: 'Hero Realms' },
      min_players: 2,
      max_players: 4,
      time: '20',
      age: 12,
      difficulty: 'easy',
      url: null,
      bgg_id: null,
      attributes: ['Card Game'],
      attribute_slugs: ['card-game'],
      featured_image: null,
    } satisfies GCGame,
  ]),
  fetchMenuItems: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="navigation" />,
}))

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

describe('GamesPage', () => {
  it('renders the page heading', async () => {
    const Page = await GamesPage()
    render(Page)
    expect(screen.getByRole('heading', { name: /games/i })).toBeTruthy()
  })

  it('renders games fetched from the API', async () => {
    const Page = await GamesPage()
    render(Page)
    expect(screen.getByText('Hero Realms')).toBeTruthy()
  })

  it('renders the GamesGrid component', async () => {
    const Page = await GamesPage()
    const { container } = render(Page)
    expect(container.querySelector('[data-testid="games-grid"]')).toBeTruthy()
  })

  it('renders navigation', async () => {
    const Page = await GamesPage()
    render(Page)
    expect(screen.getByTestId('navigation')).toBeTruthy()
  })

  it('renders footer', async () => {
    const Page = await GamesPage()
    render(Page)
    expect(screen.getByTestId('footer')).toBeTruthy()
  })
})
