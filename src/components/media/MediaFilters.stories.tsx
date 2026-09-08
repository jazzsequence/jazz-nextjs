import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { MediaFilters } from './MediaFilters'
import type { WPMediaType } from '@/lib/wordpress/types'

function mediaType(id: number, name: string, slug: string, count: number): WPMediaType {
  return {
    id,
    count,
    description: '',
    link: `https://jazzsequence.com/media-type/${slug}/`,
    name,
    slug,
    taxonomy: 'media_type',
    meta: {},
  }
}

const types: WPMediaType[] = [
  mediaType(5320, 'Livestream', 'livestream', 17),
  mediaType(5319, 'Podcast', 'podcast', 45),
  mediaType(5323, 'Presentation', 'presentation', 10),
  mediaType(5321, 'Video', 'video', 11),
]

const meta: Meta<typeof MediaFilters> = {
  title: 'Media/MediaFilters',
  component: MediaFilters,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    a11y: { test: 'error' },
  },
  args: { types },
}
export default meta

type Story = StoryObj<typeof MediaFilters>

export const NoFilter: Story = {
  name: 'No filter (All active)',
}

export const FilterActive: Story = {
  name: 'Filter active',
  args: { activeSlug: 'podcast' },
}

export const UnknownSlug: Story = {
  name: 'Unknown slug (falls back to All)',
  args: { activeSlug: 'not-a-real-type' },
}

export const NoTypes: Story = {
  name: 'No types (renders nothing)',
  args: { types: [] },
}
