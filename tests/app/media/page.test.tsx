import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as wpClient from '@/lib/wordpress/client'

vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>()
  return { ...actual, fetchPostsWithPagination: vi.fn(), fetchMenuItems: vi.fn().mockResolvedValue([]) }
})
vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({ commit: 'abc123', branch: 'main', buildTime: '2024-01-01T00:00:00Z' }),
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), forbidden: vi.fn() }))
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }))
vi.mock('@/components/Pagination', () => ({ default: () => null }))

const mockPaginatedResult = (items = [mockMediaItem()]) => ({
  data: items,
  totalItems: items.length,
  totalPages: 1,
  currentPage: 1,
})

function mockMediaItem(overrides = {}) {
  return {
    id: 1, type: 'media' as const,
    title: { rendered: 'WordPress Theme Development 101' },
    excerpt: { rendered: '<p>WordCamp Utah 2011</p>' },
    date: '2011-09-10T00:00:00', date_gmt: '2011-09-10T00:00:00',
    modified: '2011-09-10T00:00:00', modified_gmt: '2011-09-10T00:00:00',
    slug: 'wordpress-theme-development-101',
    status: 'publish' as const, link: 'https://example.com/media/test',
    featured_media: 1, template: '',
    media_url: 'https://videopress.com/v/6d5m67oo',
    _embedded: { 'wp:featuredmedia': [{ id: 1, source_url: 'https://cdn.example.com/thumb.jpg', alt_text: '' }] },
    ...overrides,
  }
}

describe('Media listing page', () => {
  it('renders the page heading', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(mockPaginatedResult())
    const MediaPage = (await import('@/app/media/page')).default
    render(await MediaPage())
    expect(screen.getByRole('heading', { name: /Media/i })).toBeInTheDocument()
  })

  it('renders a media card for each item', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(mockPaginatedResult([
      mockMediaItem({ id: 1, title: { rendered: 'Video One' } }),
      mockMediaItem({ id: 2, slug: 'video-two', title: { rendered: 'Video Two' } }),
    ]))
    const MediaPage = (await import('@/app/media/page')).default
    render(await MediaPage())
    expect(screen.getByText('Video One')).toBeInTheDocument()
    expect(screen.getByText('Video Two')).toBeInTheDocument()
  })

  it('renders gracefully when no media items are returned', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(mockPaginatedResult([]))
    const MediaPage = (await import('@/app/media/page')).default
    render(await MediaPage())
    expect(screen.getByRole('heading', { name: /Media/i })).toBeInTheDocument()
  })

  it('calls fetchPostsWithPagination with media post type', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(mockPaginatedResult([]))
    const MediaPage = (await import('@/app/media/page')).default
    await MediaPage()
    expect(wpClient.fetchPostsWithPagination).toHaveBeenCalledWith('media', expect.objectContaining({ embed: true }))
  })
})
