import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChildPage from '@/app/[parent]/[child]/page'

// Mock the WordPress client
vi.mock('@/lib/wordpress/client', () => ({
  fetchPost: vi.fn(),
  fetchMenuItems: vi.fn(),
  WPNotFoundError: class WPNotFoundError extends Error {
    statusCode = 404
    constructor(message: string) {
      super(message)
      this.name = 'WPNotFoundError'
    }
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

// Mock components
vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="navigation">Navigation</nav>,
}))

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

vi.mock('@/components/PostContent', () => ({
  default: ({ post }: { post: { content: { rendered: string } } }) => (
    <div data-testid="post-content">{post.content.rendered}</div>
  ),
}))

vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn(() =>
    Promise.resolve({
      commitShort: 'abc1234',
      buildTime: '2024-01-01T00:00:00.000Z',
    })
  ),
}))

describe('Child Page Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render child page successfully', async () => {
    const { fetchPost, fetchMenuItems } = await import('@/lib/wordpress/client')

    vi.mocked(fetchPost).mockResolvedValue({
      id: 3206,
      slug: 'loafmen',
      title: { rendered: 'Loafmen' },
      content: { rendered: '<p>Child page content</p>' },
      parent: 989,
    })

    vi.mocked(fetchMenuItems).mockResolvedValue([])

    const params = Promise.resolve({ parent: 'music', child: 'loafmen' })
    const Component = await ChildPage({ params })

    render(Component)

    expect(await screen.findByText('Loafmen')).toBeInTheDocument()
    expect(screen.getByTestId('post-content')).toBeInTheDocument()
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('should call notFound() for non-existent child pages', async () => {
    const { fetchPost, WPNotFoundError } = await import('@/lib/wordpress/client')
    const { notFound } = await import('next/navigation')

    vi.mocked(fetchPost).mockRejectedValue(
      new WPNotFoundError('Page not found')
    )

    const params = Promise.resolve({ parent: 'music', child: 'nonexistent' })

    await expect(ChildPage({ params })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('should fetch page by child slug only', async () => {
    const { fetchPost, fetchMenuItems } = await import('@/lib/wordpress/client')

    vi.mocked(fetchPost).mockResolvedValue({
      id: 3206,
      slug: 'loafmen',
      title: { rendered: 'Loafmen' },
      content: { rendered: '<p>Content</p>' },
      parent: 989,
    })

    vi.mocked(fetchMenuItems).mockResolvedValue([])

    const params = Promise.resolve({ parent: 'music', child: 'loafmen' })
    await ChildPage({ params })

    // Should fetch by child slug, not parent/child
    expect(fetchPost).toHaveBeenCalledWith(
      'pages',
      'loafmen',
      expect.objectContaining({
        isr: expect.objectContaining({
          tags: ['pages', 'page-loafmen'],
        }),
      })
    )
  })
})
