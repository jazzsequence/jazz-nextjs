import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as wpClient from '@/lib/wordpress/client'
import { notFound, forbidden } from 'next/navigation'
import type { Metadata } from 'next'

vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>()
  return { ...actual, fetchPost: vi.fn(), fetchMenuItems: vi.fn().mockResolvedValue([]) }
})
vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({ commit: 'abc123', branch: 'main', buildTime: '2024-01-01T00:00:00Z' }),
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), forbidden: vi.fn() }))
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }))

const mockMedia = (overrides = {}) => ({
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
})

describe('Media individual page', () => {
  it('renders the media title', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockMedia())
    const MediaItemPage = (await import('@/app/media/[slug]/page')).default
    render(await MediaItemPage({ params: Promise.resolve({ slug: 'wordpress-theme-development-101' }) }))
    expect(screen.getByRole('heading', { name: 'WordPress Theme Development 101' })).toBeInTheDocument()
  })

  it('renders an iframe for a VideoPress URL', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockMedia({ media_url: 'https://videopress.com/v/6d5m67oo' }))
    const MediaItemPage = (await import('@/app/media/[slug]/page')).default
    const { container } = render(await MediaItemPage({ params: Promise.resolve({ slug: 'test' }) }))
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe?.src).toContain('video.wordpress.com/embed/6d5m67oo')
  })

  it('renders an iframe for a YouTube URL', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockMedia({ media_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }))
    const MediaItemPage = (await import('@/app/media/[slug]/page')).default
    const { container } = render(await MediaItemPage({ params: Promise.resolve({ slug: 'test' }) }))
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe?.src).toContain('youtube.com/embed/dQw4w9WgXcQ')
  })

  it('renders a link for non-embeddable URLs', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockMedia({ media_url: 'https://wptavern.com/podcast/68' }))
    const MediaItemPage = (await import('@/app/media/[slug]/page')).default
    render(await MediaItemPage({ params: Promise.resolve({ slug: 'test' }) }))
    expect(screen.getByRole('link', { name: /Watch\/Listen/i })).toHaveAttribute('href', 'https://wptavern.com/podcast/68')
  })

  it('calls notFound when the media item does not exist', async () => {
    vi.mocked(wpClient.fetchPost).mockRejectedValue(new wpClient.WPNotFoundError('Media', 'not-exist'))
    const MediaItemPage = (await import('@/app/media/[slug]/page')).default
    await MediaItemPage({ params: Promise.resolve({ slug: 'not-exist' }) })
    expect(notFound).toHaveBeenCalled()
  })

  it('calls forbidden when the media item is private', async () => {
    vi.mocked(wpClient.fetchPost).mockRejectedValue(new wpClient.WPForbiddenError('Media', 'private'))
    const MediaItemPage = (await import('@/app/media/[slug]/page')).default
    await MediaItemPage({ params: Promise.resolve({ slug: 'private' }) })
    expect(forbidden).toHaveBeenCalled()
  })

  it('uses the item title as alt text on the thumbnail image for external media', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockMedia({
      media_url: 'https://wptavern.com/podcast/68',
      _embedded: { 'wp:featuredmedia': [{ id: 1, source_url: 'https://cdn.example.com/thumb.jpg', alt_text: '' }] },
    }))
    const MediaItemPage = (await import('@/app/media/[slug]/page')).default
    const { container } = render(await MediaItemPage({ params: Promise.resolve({ slug: 'test' }) }))
    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.alt).toBe('WordPress Theme Development 101')
  })
})

describe('Media individual page — generateMetadata', () => {
  it('returns correct title, description, canonical, and openGraph for a known item', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockMedia({
      title: { rendered: 'My Talk &amp; Demo' },
      excerpt: { rendered: '<p>A great talk about WordPress.</p>' },
      _embedded: { 'wp:featuredmedia': [{ id: 1, source_url: 'https://cdn.example.com/thumb.jpg', alt_text: '' }] },
    }))
    const { generateMetadata } = await import('@/app/media/[slug]/page')
    const metadata: Metadata = await generateMetadata({ params: Promise.resolve({ slug: 'my-talk-demo' }) })

    expect(metadata.title).toBe('My Talk & Demo')
    expect(metadata.description).toBe('A great talk about WordPress.')
    expect((metadata.alternates as { canonical?: string })?.canonical).toBe('/media/my-talk-demo')
    const og = metadata.openGraph as { type?: string; url?: string; images?: unknown[] }
    expect(og?.type).toBe('video.other')
    expect(og?.url).toBe('/media/my-talk-demo')
    expect(og?.images).toHaveLength(1)
  })

  it('returns fallback title when the item is not found', async () => {
    vi.mocked(wpClient.fetchPost).mockRejectedValue(new wpClient.WPNotFoundError('Media', 'no-item'))
    const { generateMetadata } = await import('@/app/media/[slug]/page')
    const metadata: Metadata = await generateMetadata({ params: Promise.resolve({ slug: 'no-item' }) })
    expect(metadata.title).toBe('Media Not Found')
  })

  it('omits openGraph images when there is no featured media', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockMedia({
      _embedded: undefined,
    }))
    const { generateMetadata } = await import('@/app/media/[slug]/page')
    const metadata: Metadata = await generateMetadata({ params: Promise.resolve({ slug: 'test' }) })
    const og = metadata.openGraph as { images?: unknown[] }
    expect(og?.images).toHaveLength(0)
  })
})

describe('generateStaticParams', () => {
  it('returns empty array for on-demand ISR', async () => {
    const { generateStaticParams } = await import('@/app/media/[slug]/page')
    const params = await generateStaticParams()
    expect(params).toEqual([])
  })
})
