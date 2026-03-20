import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GameModal } from './GameModal'
import type { GCGame } from '@/lib/wordpress/types'

const PLACEHOLDER_BOX_ART = 'https://picsum.photos/seed/twilight/600/400'

const game: GCGame = {
  id: 1,
  slug: 'twilight-imperium',
  date: '2021-01-01T00:00:00',
  title: { rendered: 'Twilight Imperium (4th Ed.)' },
  min_players: 3,
  max_players: 8,
  time: '240-480',
  age: 14,
  difficulty: 'hardcore',
  url: 'https://www.boardgamegeek.com/boardgame/233078/twilight-imperium-fourth-edition',
  bgg_id: 233078,
  attributes: ['Strategy', 'Science Fiction', 'Negotiation', 'Space', 'Political'],
  attribute_slugs: ['strategy', 'science-fiction', 'negotiation', 'space', 'political'],
  featured_image: null,
}

const gameWithImage: GCGame = {
  ...game,
  id: 2,
  featured_image: {
    id: 100,
    url: PLACEHOLDER_BOX_ART,
    width: 600,
    height: 400,
    alt: 'Twilight Imperium box art (placeholder)',
  },
}

const meta: Meta<typeof GameModal> = {
  title: 'Design System/GameModal',
  component: GameModal,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    a11y: { test: 'error' },
  },
  args: {
    onClose: () => console.log('Close modal'),
  },
}
export default meta

type Story = StoryObj<typeof GameModal>

export const Open: Story = {
  name: 'Open (no box art)',
  args: { game },
}

export const OpenWithImage: Story = {
  name: 'Open (with box art)',
  args: { game: gameWithImage },
}

export const Closed: Story = {
  name: 'Closed (null game)',
  args: { game: null },
}
