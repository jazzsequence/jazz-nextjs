import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TagArchivePage from '@/app/tag/[slug]/page'
import * as wpClient from '@/lib/wordpress/client'
import type { WPPost, WPTag } from '@/lib/wordpress/types'

vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>()
  return {
    ...actual,
    fetchTagBySlug: vi.fn(),
    fetchPostsWithPagination: vi.fn(),
    fetchMenuItems: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="navigation" />,
}))

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

const mockTag: WPTag = {
  id: 273,
  name: 'teh s3quence',
  slug: 'teh-s3quence',
  count: 19,
  description: '',
  link: 'https://jazzsequence.com/tag/teh-s3quence/',
  taxonomy: 'post_tag',
  meta: {},
}

const makeMockPost = (id: number, title: string): WPPost => ({
  id,
  type: 'post',
  title: { rendered: title },
  excerpt: { rendered: `<p>Excerpt for ${title}</p>` },
  content: { rendered: `<p>Content for ${title}</p>` },
  date: '2024-01-01T00:00:00',
  date_gmt: '2024-01-01T00:00:00',
  modified: '2024-01-01T00:00:00',
  modified_gmt: '2024-01-01T00:00:00',
  slug: title.toLowerCase().replace(/ /g, '-'),
  status: 'publish',
  link: `https://example.com/${title.toLowerCase()}`,
  author: 1,
  featured_media: 0,
  comment_status: 'open',
  ping_status: 'open',
  sticky: false,
  template: '',
  format: 'standard',
  meta: {},
  categories: [],
  tags: [273],
})

describe('TagArchivePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the tag name as the page heading', async () => {
    vi.mocked(wpClient.fetchTagBySlug).mockResolvedValue(mockTag)
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: [makeMockPost(1, 'First Post')],
      totalItems: 1,
      totalPages: 1,
      currentPage: 1,
    })

    const page = await TagArchivePage({
      params: Promise.resolve({ slug: 'teh-s3quence' }),
      searchParams: Promise.resolve({}),
    })
    render(page)

    expect(screen.getByRole('heading', { name: /teh s3quence/i })).toBeTruthy()
  })

  it('renders posts tagged with the slug', async () => {
    vi.mocked(wpClient.fetchTagBySlug).mockResolvedValue(mockTag)
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: [makeMockPost(1, 'First Post'), makeMockPost(2, 'Second Post')],
      totalItems: 2,
      totalPages: 1,
      currentPage: 1,
    })

    const page = await TagArchivePage({
      params: Promise.resolve({ slug: 'teh-s3quence' }),
      searchParams: Promise.resolve({}),
    })
    render(page)

    expect(screen.getByText('First Post')).toBeTruthy()
    expect(screen.getByText('Second Post')).toBeTruthy()
  })

  it('fetches posts filtered by tag ID', async () => {
    vi.mocked(wpClient.fetchTagBySlug).mockResolvedValue(mockTag)
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
    })

    await TagArchivePage({
      params: Promise.resolve({ slug: 'teh-s3quence' }),
      searchParams: Promise.resolve({}),
    })

    expect(wpClient.fetchPostsWithPagination).toHaveBeenCalledWith(
      'posts',
      expect.objectContaining({ tags: [273] })
    )
  })

  it('shows no posts message when tag has no posts', async () => {
    vi.mocked(wpClient.fetchTagBySlug).mockResolvedValue(mockTag)
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
    })

    const page = await TagArchivePage({
      params: Promise.resolve({ slug: 'teh-s3quence' }),
      searchParams: Promise.resolve({}),
    })
    render(page)

    expect(screen.getByText(/no posts found/i)).toBeTruthy()
  })

  it('renders navigation and footer', async () => {
    vi.mocked(wpClient.fetchTagBySlug).mockResolvedValue(mockTag)
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
    })

    const page = await TagArchivePage({
      params: Promise.resolve({ slug: 'teh-s3quence' }),
      searchParams: Promise.resolve({}),
    })
    render(page)

    expect(screen.getByTestId('navigation')).toBeTruthy()
    expect(screen.getByTestId('footer')).toBeTruthy()
  })

  it('calls notFound when tag does not exist', async () => {
    const { WPNotFoundError } = await import('@/lib/wordpress/client')
    vi.mocked(wpClient.fetchTagBySlug).mockRejectedValue(
      new WPNotFoundError('tag', 'nonexistent')
    )

    await expect(
      TagArchivePage({
        params: Promise.resolve({ slug: 'nonexistent' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})

