import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameCard } from '@/components/games/GameCard'
import type { GCGame } from '@/lib/wordpress/types'

const mockGame: GCGame = {
  id: 218,
  slug: 'hero-realms',
  date: '2021-01-01T00:00:00',
  title: { rendered: 'Hero Realms' },
  min_players: 2,
  max_players: 4,
  time: '20',
  age: 12,
  difficulty: 'easy',
  url: 'https://boardgamegeek.com/boardgame/218762',
  bgg_id: 218762,
  attributes: ['Card Game', 'Fantasy'],
  attribute_slugs: ['card-game', 'fantasy'],
  featured_image: {
    id: 1,
    url: 'https://example.com/image.jpg',
    width: 200,
    height: 250,
    alt: 'Hero Realms box art',
  },
}

describe('GameCard', () => {
  it('renders the game title', () => {
    render(<GameCard game={mockGame} onClick={() => {}} />)
    expect(screen.getByText('Hero Realms')).toBeTruthy()
  })

  it('renders box art when featured_image is present', () => {
    render(<GameCard game={mockGame} onClick={() => {}} />)
    const img = screen.getByAltText('Hero Realms box art')
    expect(img).toBeTruthy()
  })

  it('renders a placeholder when no featured_image', () => {
    const noImage = { ...mockGame, featured_image: null }
    render(<GameCard game={noImage} onClick={() => {}} />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('Hero Realms')).toBeTruthy()
  })

  it('displays player count', () => {
    render(<GameCard game={mockGame} onClick={() => {}} />)
    expect(screen.getByText(/2.+4/)).toBeTruthy()
  })

  it('displays playing time', () => {
    render(<GameCard game={mockGame} onClick={() => {}} />)
    expect(screen.getByText(/20/)).toBeTruthy()
  })

  it('displays difficulty', () => {
    render(<GameCard game={mockGame} onClick={() => {}} />)
    expect(screen.getByText(/easy/i)).toBeTruthy()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GameCard game={mockGame} onClick={onClick} />)
    const card = screen.getByRole('button')
    card.click()
    expect(onClick).toHaveBeenCalledWith(mockGame)
  })

  it('handles game with only min players', () => {
    const soloGame = { ...mockGame, min_players: 1, max_players: null }
    render(<GameCard game={soloGame} onClick={() => {}} />)
    expect(screen.getByText(/1\+/)).toBeTruthy()
  })

  it('renders attribute tags', () => {
    render(<GameCard game={mockGame} onClick={() => {}} />)
    expect(screen.getByText('Card Game')).toBeTruthy()
    expect(screen.getByText('Fantasy')).toBeTruthy()
  })
})
