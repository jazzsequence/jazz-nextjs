import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GameCard } from './GameCard'
import type { GCGame } from '@/lib/wordpress/types'

const base: GCGame = {
  id: 1,
  slug: 'hero-realms',
  date: '2021-01-01T00:00:00',
  title: { rendered: 'Hero Realms' },
  min_players: 2,
  max_players: 4,
  time: '20-45',
  age: 12,
  difficulty: 'easy',
  url: 'https://www.boardgamegeek.com/boardgame/198994/hero-realms',
  bgg_id: 198994,
  attributes: ['Card Game', 'Fantasy', 'Fighting'],
  attribute_slugs: ['card-game', 'fantasy', 'fighting'],
  featured_image: null,
}

// Placeholder image guaranteed to load in Storybook (no external CDN dependency)
// picsum.photos serves real Unsplash photos — gives realistic preview of box art proportions
const PLACEHOLDER_BOX_ART = 'https://picsum.photos/seed/twilight/400/533'

const withImage: GCGame = {
  ...base,
  id: 2,
  slug: 'twilight-imperium',
  title: { rendered: 'Twilight Imperium (4th Ed.)' },
  min_players: 3,
  max_players: 8,
  time: '240-480',
  age: 14,
  difficulty: 'hardcore',
  attributes: ['Strategy', 'Science Fiction', 'Negotiation', 'Space'],
  attribute_slugs: ['strategy', 'science-fiction', 'negotiation', 'space'],
  featured_image: {
    id: 100,
    url: PLACEHOLDER_BOX_ART,
    width: 400,
    height: 533,
    alt: 'Twilight Imperium box art (placeholder)',
  },
}

const meta: Meta<typeof GameCard> = {
  title: 'Design System/GameCard',
  component: GameCard,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  args: {
    onClick: (game: GCGame) => console.log('Clicked:', game.title.rendered),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '160px' }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof GameCard>

export const WithoutImage: Story = {
  name: 'Without Box Art (placeholder)',
  args: { game: base },
}

export const WithImage: Story = {
  name: 'With Box Art',
  args: { game: withImage },
}

export const LongTitle: Story = {
  name: 'Long Game Title',
  args: {
    game: { ...base, title: { rendered: 'Spirit Island: Nature Incarnate' }, attributes: ['Strategy', 'Cooperative'] },
  },
}

export const GridLayout: Story = {
  name: 'Grid Layout (as deployed)',
  parameters: { layout: 'fullscreen' },
  decorators: [
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_Story) => (
      // Matches GamesGrid: grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
      // Shown at md breakpoint (4 cols) for a realistic mid-size preview
      <div style={{ padding: '2rem', background: '#0d0d1a' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))', gap: '1rem', maxWidth: '64rem' }}>
          <GameCard game={base} onClick={() => {}} />
          <GameCard game={withImage} onClick={() => {}} />
          <GameCard game={{ ...base, id: 3, slug: 'dominion', title: { rendered: 'Dominion' }, difficulty: 'moderate' }} onClick={() => {}} />
          <GameCard game={{ ...base, id: 4, slug: 'codenames', title: { rendered: 'Codenames' }, attributes: ['Party', 'Word'] }} onClick={() => {}} />
          <GameCard game={base} onClick={() => {}} />
          <GameCard game={withImage} onClick={() => {}} />
        </div>
      </div>
    ),
  ],
  render: () => <></>,
}
