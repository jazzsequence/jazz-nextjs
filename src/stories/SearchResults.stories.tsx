import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import SearchResults from '@/components/SearchResults'
import type { WPPost } from '@/lib/wordpress/types'

/**
 * SearchResults — displays search results with filter tabs, result count,
 * query term highlighting, and an empty state.
 *
 * WCAG 2.1 AA: live region for count, aria-current on active filter tab,
 * mark elements for highlighted terms, role=status for empty state.
 */

const meta: Meta<typeof SearchResults> = {
  title: 'Components/SearchResults',
  component: SearchResults,
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
    nextjs: {
      // Provide a router for Link components inside the component
      navigation: {
        pathname: '/search',
        query: { q: 'jazz', type: 'all' },
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['all', 'post', 'media'],
    },
  },
}

export default meta
type Story = StoryObj<typeof SearchResults>

function makePost(id: number, title: string, type: 'post' = 'post', overrides: Partial<WPPost> = {}): WPPost {
  return {
    id,
    type,
    title: { rendered: title },
    excerpt: { rendered: `<p>This is an excerpt about jazz music and creative development — result ${id}.</p>` },
    content: { rendered: '<p>Full content here.</p>' },
    date: '2024-06-01T00:00:00',
    date_gmt: '2024-06-01T00:00:00',
    modified: '2024-06-01T00:00:00',
    modified_gmt: '2024-06-01T00:00:00',
    slug: `result-${id}`,
    status: 'publish',
    link: `https://jazzsequence.com/posts/result-${id}`,
    author: 1,
    featured_media: 0,
    comment_status: 'open',
    ping_status: 'open',
    sticky: false,
    template: '',
    format: 'standard',
    meta: {},
    categories: [],
    tags: [],
    ...overrides,
  }
}

const samplePosts: WPPost[] = [
  makePost(1, 'Jazz Guitar Techniques for Beginners'),
  makePost(2, 'The History of Jazz: From New Orleans to Today'),
  makePost(3, 'Playing Jazz Standards on Guitar'),
  makePost(4, 'Jazz Theory: Understanding Modes'),
]

export const WithResults: Story = {
  name: 'With results',
  args: {
    results: samplePosts,
    query: 'jazz',
    type: 'all',
    totalPages: 2,
    currentPage: 1,
  },
}

export const EmptyState: Story = {
  name: 'Empty state',
  args: {
    results: [],
    query: 'xyzzy',
    type: 'all',
    totalPages: 0,
    currentPage: 1,
  },
}

export const FilteredToMedia: Story = {
  name: 'Filtered to Media tab',
  args: {
    results: [
      makePost(10, 'WordPress Theme Development 101', 'post', {
        type: 'post' as const,
        slug: 'wp-theme-dev-101',
        excerpt: { rendered: '<p>A WordCamp talk covering jazz-inspired design principles.</p>' },
      }),
    ],
    query: 'jazz',
    type: 'media',
    totalPages: 1,
    currentPage: 1,
  },
}

export const ManyResults: Story = {
  name: 'Many results (page 1 of 3)',
  args: {
    results: [
      ...samplePosts,
      makePost(5, 'Jazz in the Digital Age', 'post', { slug: 'jazz-digital-age' }),
      makePost(6, 'Learning Jazz Harmony', 'post', { slug: 'jazz-harmony' }),
    ],
    query: 'jazz',
    type: 'all',
    totalPages: 3,
    currentPage: 1,
  },
}
