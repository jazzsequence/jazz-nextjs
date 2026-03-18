import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GameModal } from '@/components/games/GameModal'
import type { GCGame } from '@/lib/wordpress/types'

const mockGame: GCGame = {
  id: 218,
  slug: 'hero-realms',
  date: '2021-01-01T00:00:00',
  title: { rendered: 'Hero Realms' },
  min_players: 2,
  max_players: 4,
  time: '20-45',
  age: 12,
  difficulty: 'moderate',
  url: 'https://boardgamegeek.com/boardgame/218762',
  bgg_id: 218762,
  attributes: ['Card Game', 'Fantasy', 'Fighting'],
  attribute_slugs: ['card-game', 'fantasy', 'fighting'],
  featured_image: {
    id: 1,
    url: 'https://example.com/image.jpg',
    width: 200,
    height: 250,
    alt: 'Hero Realms box art',
  },
}

describe('GameModal', () => {
  it('renders nothing when game is null', () => {
    const { container } = render(<GameModal game={null} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders game title when open', () => {
    render(<GameModal game={mockGame} onClose={() => {}} />)
    expect(screen.getByText('Hero Realms')).toBeTruthy()
  })

  it('renders all metadata fields', () => {
    render(<GameModal game={mockGame} onClose={() => {}} />)
    expect(screen.getByText('2 – 4')).toBeTruthy()        // players
    expect(screen.getByText('20-45 min')).toBeTruthy()    // time
    expect(screen.getByText('12+')).toBeTruthy()          // age
    expect(screen.getByText(/moderate/i)).toBeTruthy()    // difficulty
  })

  it('renders attribute tags', () => {
    render(<GameModal game={mockGame} onClose={() => {}} />)
    expect(screen.getByText('Card Game')).toBeTruthy()
    expect(screen.getByText('Fantasy')).toBeTruthy()
    expect(screen.getByText('Fighting')).toBeTruthy()
  })

  it('renders a BGG link when url is present', () => {
    render(<GameModal game={mockGame} onClose={() => {}} />)
    const link = screen.getByRole('link', { name: /board game geek/i })
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('https://boardgamegeek.com/boardgame/218762')
  })

  it('does not render BGG link when url is null', () => {
    render(<GameModal game={{ ...mockGame, url: null }} onClose={() => {}} />)
    expect(screen.queryByRole('link', { name: /board game geek/i })).toBeNull()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<GameModal game={mockGame} onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: /close/i })
    closeBtn.click()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<GameModal game={mockGame} onClose={onClose} />)
    const backdrop = screen.getByTestId('modal-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close when modal content is clicked', () => {
    const onClose = vi.fn()
    render(<GameModal game={mockGame} onClose={onClose} />)
    const content = screen.getByTestId('modal-content')
    fireEvent.click(content)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders box art when featured_image is present', () => {
    render(<GameModal game={mockGame} onClose={() => {}} />)
    const img = screen.getByAltText('Hero Realms box art')
    expect(img).toBeTruthy()
  })
})
