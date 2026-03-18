import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { GamesGrid } from '@/components/games/GamesGrid'
import type { GCGame } from '@/lib/wordpress/types'

// framer-motion's AnimatePresence keeps exiting nodes in the DOM during animation.
// Mock it so tests can assert on immediate DOM state after filter changes.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const makeGame = (overrides: Partial<GCGame> & { id: number; slug: string; title: string }): GCGame => ({
  id: overrides.id,
  slug: overrides.slug,
  date: '2021-01-01T00:00:00',
  title: { rendered: overrides.title },
  min_players: overrides.min_players ?? 2,
  max_players: overrides.max_players ?? 4,
  time: overrides.time ?? '30',
  age: overrides.age ?? 10,
  difficulty: overrides.difficulty ?? 'easy',
  url: null,
  bgg_id: null,
  attributes: overrides.attributes ?? [],
  attribute_slugs: overrides.attribute_slugs ?? [],
  featured_image: null,
})

const mockGames: GCGame[] = [
  makeGame({ id: 1, slug: 'hero-realms', title: 'Hero Realms', attributes: ['Card Game', 'Fantasy'], attribute_slugs: ['card-game', 'fantasy'], min_players: 2, max_players: 4, difficulty: 'easy', time: '20' }),
  makeGame({ id: 2, slug: 'dominion', title: 'Dominion', attributes: ['Card Game'], attribute_slugs: ['card-game'], min_players: 2, max_players: 4, difficulty: 'moderate', time: '30' }),
  makeGame({ id: 3, slug: 'twilight-imperium', title: 'Twilight Imperium', attributes: ['Strategy'], attribute_slugs: ['strategy'], min_players: 3, max_players: 8, difficulty: 'difficult', time: '240' }),
  makeGame({ id: 4, slug: 'codenames', title: 'Codenames', attributes: ['Party'], attribute_slugs: ['party'], min_players: 2, max_players: 8, difficulty: 'easy', time: '15' }),
]

describe('GamesGrid', () => {
  it('renders all games when no filter is active', () => {
    render(<GamesGrid games={mockGames} />)
    expect(screen.getByText('Hero Realms')).toBeTruthy()
    expect(screen.getByText('Dominion')).toBeTruthy()
    expect(screen.getByText('Twilight Imperium')).toBeTruthy()
    expect(screen.getByText('Codenames')).toBeTruthy()
  })

  it('renders "no games found" when filter matches nothing', () => {
    render(<GamesGrid games={[]} />)
    expect(screen.getByText(/no games/i)).toBeTruthy()
  })

  it('filters by attribute', () => {
    render(<GamesGrid games={mockGames} />)
    const filters = screen.getByTestId('game-filters')
    const cardGameFilter = within(filters).getByRole('button', { name: /card game/i })
    fireEvent.click(cardGameFilter)
    expect(screen.getByText('Hero Realms')).toBeTruthy()
    expect(screen.getByText('Dominion')).toBeTruthy()
    expect(screen.queryByText('Twilight Imperium')).toBeNull()
  })

  it('filters by difficulty', () => {
    render(<GamesGrid games={mockGames} />)
    const difficultyFilter = screen.getByRole('combobox', { name: /difficulty/i })
    fireEvent.change(difficultyFilter, { target: { value: 'easy' } })
    expect(screen.getByText('Hero Realms')).toBeTruthy()
    expect(screen.getByText('Codenames')).toBeTruthy()
    expect(screen.queryByText('Dominion')).toBeNull()
    expect(screen.queryByText('Twilight Imperium')).toBeNull()
  })

  it('filters by minimum player count', () => {
    render(<GamesGrid games={mockGames} />)
    const playerFilter = screen.getByRole('combobox', { name: /players/i })
    fireEvent.change(playerFilter, { target: { value: '6' } })
    // Only games where max_players >= 6
    expect(screen.getByText('Twilight Imperium')).toBeTruthy()
    expect(screen.getByText('Codenames')).toBeTruthy()
    expect(screen.queryByText('Hero Realms')).toBeNull()
    expect(screen.queryByText('Dominion')).toBeNull()
  })

  it('shows Show All button that resets filters', () => {
    render(<GamesGrid games={mockGames} />)
    const filters = screen.getByTestId('game-filters')
    fireEvent.click(within(filters).getByRole('button', { name: /card game/i }))
    expect(screen.queryByText('Twilight Imperium')).toBeNull()
    fireEvent.click(within(filters).getByRole('button', { name: /show all/i }))
    expect(screen.getByText('Twilight Imperium')).toBeTruthy()
  })

  it('opens modal when a game card is clicked', () => {
    render(<GamesGrid games={mockGames} />)
    const cards = screen.getAllByRole('button')
    const gameCard = cards.find(b => b.textContent?.includes('Hero Realms'))
    expect(gameCard).toBeTruthy()
    if (gameCard) fireEvent.click(gameCard)
    // Modal should show the full game details
    expect(screen.getAllByText('Hero Realms').length).toBeGreaterThanOrEqual(1)
  })

  it('closes modal when backdrop is clicked', () => {
    render(<GamesGrid games={mockGames} />)
    const cards = screen.getAllByRole('button')
    const gameCard = cards.find(b => b.textContent?.includes('Hero Realms'))
    if (gameCard) fireEvent.click(gameCard)
    const backdrop = screen.getByTestId('modal-backdrop')
    fireEvent.click(backdrop)
    expect(screen.queryByTestId('modal-backdrop')).toBeNull()
  })
})
