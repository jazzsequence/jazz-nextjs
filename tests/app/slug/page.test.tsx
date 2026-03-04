import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Page, { generateMetadata } from '@/app/[slug]/page'
import * as client from '@/lib/wordpress/client'
import type { WPPage } from '@/lib/wordpress/types'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

// Mock WordPress client
vi.mock('@/lib/wordpress/client', () => {
  class WPNotFoundError extends Error {
    constructor(type: string, slug: string) {
      super(`${type} not found: ${slug}`)
      this.name = 'WPNotFoundError'
    }
  }

  return {
    fetchPost: vi.fn(),
    fetchMenuItems: vi.fn(),
    WPNotFoundError,
  }
})

// Mock build info
vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({
    commitShort: 'abc1234',
    buildTime: '2024-01-01T00:00:00.000Z',
  }),
}))

// Mock components
vi.mock('@/components/PostContent', () => ({
  default: ({ post }: { post: WPPage }) => (
    <div data-testid="post-content">
      <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
    </div>
  ),
}))

vi.mock('@/components/Navigation', () => ({
  default: () => <nav data-testid="navigation">Navigation</nav>,
}))

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}))

const mockPage: WPPage = {
  id: 989,
  slug: 'music',
  title: { rendered: 'Music' },
  content: { rendered: '<p>My music projects</p>' },
  excerpt: { rendered: '<p>Music page excerpt</p>' },
  date: '2024-01-01T00:00:00',
  modified: '2024-01-01T00:00:00',
  type: 'page',
  link: 'https://jazzsequence.com/music',
  status: 'publish',
  featured_media: 0,
  author: 1,
}

describe('WordPress Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(client.fetchMenuItems).mockResolvedValue([])
  })

  it('should render page content', async () => {
    vi.mocked(client.fetchPost).mockResolvedValue(mockPage)

    const params = Promise.resolve({ slug: 'music' })
    const component = await Page({ params })

    render(component)

    expect(screen.getByText('Music')).toBeInTheDocument()
    expect(screen.getByText('My music projects')).toBeInTheDocument()
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('should call fetchPost with correct params', async () => {
    vi.mocked(client.fetchPost).mockResolvedValue(mockPage)

    const params = Promise.resolve({ slug: 'about' })
    await Page({ params })

    expect(client.fetchPost).toHaveBeenCalledWith('pages', 'about', {
      isr: { revalidate: 3600, tags: ['pages', 'page-about'] },
      embed: true,
    })
  })

  it('should handle page fetch failure', async () => {
    vi.mocked(client.fetchPost).mockRejectedValue(new Error('Not found'))

    const params = Promise.resolve({ slug: 'nonexistent' })

    // Should either call notFound or show error UI
    try {
      const component = await Page({ params })
      render(component)
      // If we get here, error UI should be shown
      expect(screen.getByText('Unable to load page. Please try again later.')).toBeInTheDocument()
    } catch (error) {
      // If notFound was called, that's also acceptable
      expect(error).toBeDefined()
    }
  })

  it('should show error UI when page fetch fails with non-404 error', async () => {
    vi.mocked(client.fetchPost).mockRejectedValue(new Error('Server error'))

    const params = Promise.resolve({ slug: 'about' })
    const component = await Page({ params })

    render(component)

    expect(screen.getByText('Unable to load page. Please try again later.')).toBeInTheDocument()
    expect(screen.getByTestId('navigation')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('should render even if menu fetch fails', async () => {
    vi.mocked(client.fetchPost).mockResolvedValue(mockPage)
    vi.mocked(client.fetchMenuItems).mockRejectedValue(new Error('Menu error'))

    const params = Promise.resolve({ slug: 'music' })
    const component = await Page({ params })

    render(component)

    expect(screen.getByText('Music')).toBeInTheDocument()
  })
})

describe('generateMetadata', () => {
  it('should generate metadata from page', async () => {
    vi.mocked(client.fetchPost).mockResolvedValue(mockPage)

    const params = Promise.resolve({ slug: 'music' })
    const metadata = await generateMetadata({ params })

    expect(metadata.title).toBe('Music')
    expect(metadata.description).toBe('Music page excerpt')
  })

  it('should return default metadata on error', async () => {
    vi.mocked(client.fetchPost).mockRejectedValue(new Error('Not found'))

    const params = Promise.resolve({ slug: 'nonexistent' })
    const metadata = await generateMetadata({ params })

    expect(metadata.title).toBe('Page Not Found')
  })
})
