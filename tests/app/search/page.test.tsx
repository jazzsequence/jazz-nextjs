import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as wpClient from '@/lib/wordpress/client'
import type { WPPost } from '@/lib/wordpress/types'

vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>()
  return {
    ...actual,
    fetchPostsWithPagination: vi.fn(),
    fetchMenuItems: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({
    commitShort: 'abc123',
    buildTime: '2026-01-01T00:00:00Z',
  }),
}))

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}))

vi.mock('@/components/Pagination', () => ({
  default: () => null,
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} src={String(props.src)} />
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

function makePost(overrides: Partial<WPPost> = {}): WPPost {
  return {
    id: 1,
    type: 'post',
    title: { rendered: 'Test Post' },
    excerpt: { rendered: '<p>An excerpt</p>' },
    content: { rendered: '<p>Content</p>' },
    date: '2024-01-01T00:00:00',
    date_gmt: '2024-01-01T00:00:00',
    modified: '2024-01-01T00:00:00',
    modified_gmt: '2024-01-01T00:00:00',
    slug: 'test-post',
    status: 'publish',
    link: 'https://jazzsequence.com/test-post',
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

const paginatedResult = (posts: WPPost[] = [makePost()]) => ({
  data: posts,
  totalItems: posts.length,
  totalPages: 1,
  currentPage: 1,
})

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading with the query term', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(paginatedResult())
    const SearchPage = (await import('@/app/search/page')).default
    render(await SearchPage({ searchParams: Promise.resolve({ q: 'jazz' }) }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Results for')
    expect(screen.getByText('jazz')).toBeInTheDocument()
  })

  it('renders cards for results', async () => {
    const posts = [
      makePost({ id: 1, title: { rendered: 'First Result' }, slug: 'first-result' }),
      makePost({ id: 2, title: { rendered: 'Second Result' }, slug: 'second-result' }),
    ]
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(paginatedResult(posts))
    const SearchPage = (await import('@/app/search/page')).default
    render(await SearchPage({ searchParams: Promise.resolve({ q: 'result' }) }))
    expect(screen.getByText('First Result')).toBeInTheDocument()
    expect(screen.getByText('Second Result')).toBeInTheDocument()
  })

  it('shows empty state when no results', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(paginatedResult([]))
    const SearchPage = (await import('@/app/search/page')).default
    render(await SearchPage({ searchParams: Promise.resolve({ q: 'noresults' }) }))
    expect(screen.getByText(/no results found for/i)).toBeInTheDocument()
  })

  it('renders with empty query when q param is missing', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(paginatedResult([]))
    const SearchPage = (await import('@/app/search/page')).default
    render(await SearchPage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('fetches posts when type is all', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(paginatedResult())
    const SearchPage = (await import('@/app/search/page')).default
    await SearchPage({ searchParams: Promise.resolve({ q: 'test', type: 'all' }) })
    expect(wpClient.fetchPostsWithPagination).toHaveBeenCalledWith(
      'posts',
      expect.objectContaining({ search: 'test' })
    )
  })

  it('fetches media when type is media', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue(paginatedResult())
    const SearchPage = (await import('@/app/search/page')).default
    await SearchPage({ searchParams: Promise.resolve({ q: 'talk', type: 'media' }) })
    expect(wpClient.fetchPostsWithPagination).toHaveBeenCalledWith(
      'media',
      expect.objectContaining({ search: 'talk' })
    )
  })

  it('exports revalidate=0 for always-fresh search results', async () => {
    const mod = await import('@/app/search/page')
    expect(mod.revalidate).toBe(0)
  })
})
