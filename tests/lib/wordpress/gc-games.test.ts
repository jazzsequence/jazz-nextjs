import { describe, it, expect } from 'vitest'
import { GCGameSchema, GCGamesSchema } from '@/lib/wordpress/schemas'

const mockGame = {
  id: 218,
  slug: 'hero-realms',
  date: '2021-01-01T00:00:00',
  title: { rendered: 'Hero Realms' },
  min_players: 2,
  max_players: 4,
  time: '20',
  age: 12,
  difficulty: 'easy',
  url: 'https://boardgamegeek.com/boardgame/218762/hero-realms',
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

describe('GCGameSchema', () => {
  it('validates a complete game object', () => {
    const result = GCGameSchema.safeParse(mockGame)
    expect(result.success).toBe(true)
  })

  it('casts min_players and max_players as integers', () => {
    const result = GCGameSchema.safeParse(mockGame)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.min_players).toBe('number')
      expect(result.data.min_players).toBe(2)
    }
  })

  it('allows nullable fields to be null', () => {
    const sparse = { ...mockGame, min_players: null, max_players: null, time: null, age: null, difficulty: null, url: null, bgg_id: null, featured_image: null }
    const result = GCGameSchema.safeParse(sparse)
    expect(result.success).toBe(true)
  })

  it('validates featured_image as null when no image', () => {
    const result = GCGameSchema.safeParse({ ...mockGame, featured_image: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.featured_image).toBeNull()
    }
  })

  it('validates attributes as string arrays', () => {
    const result = GCGameSchema.safeParse(mockGame)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(Array.isArray(result.data.attributes)).toBe(true)
      expect(result.data.attributes).toContain('Card Game')
    }
  })

  it('rejects missing required id', () => {
    const withoutId = Object.fromEntries(Object.entries(mockGame).filter(([k]) => k !== 'id'))
    const result = GCGameSchema.safeParse(withoutId)
    expect(result.success).toBe(false)
  })
})

describe('GCGamesSchema', () => {
  it('validates an array of games', () => {
    const result = GCGamesSchema.safeParse([mockGame, { ...mockGame, id: 219, slug: 'dominion' }])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(2)
    }
  })

  it('validates an empty array', () => {
    const result = GCGamesSchema.safeParse([])
    expect(result.success).toBe(true)
  })
})
