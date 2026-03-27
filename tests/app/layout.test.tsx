import { describe, it, expect, vi } from 'vitest'

// Mock fetchSiteInfo before importing layout
vi.mock('@/lib/wordpress/site-info', () => ({
  fetchSiteInfo: vi.fn().mockResolvedValue({
    name: 'Test Site',
    description: 'Test site description',
    url: 'https://jazzsequence.com',
  }),
}))

// Mock next/font/google (not available in test env)
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans', className: 'geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono', className: 'geist-mono' }),
}))

// Mock @fontsource imports
vi.mock('@fontsource/victor-mono/400.css', () => ({}))
vi.mock('@fontsource/victor-mono/400-italic.css', () => ({}))
vi.mock('@fontsource/victor-mono/700.css', () => ({}))
vi.mock('@fontsource/space-grotesk/400.css', () => ({}))
vi.mock('@fontsource/space-grotesk/500.css', () => ({}))
vi.mock('@fontsource/space-grotesk/700.css', () => ({}))
vi.mock('./globals.css', () => ({}))

import { generateMetadata } from '@/app/layout'

describe('generateMetadata', () => {
  it('should include metadataBase with NEXT_PUBLIC_SITE_URL', async () => {
    const metadata = await generateMetadata()

    expect(metadata.metadataBase).toBeInstanceOf(URL)
    expect(metadata.metadataBase?.href).toMatch(/jazzsequence\.com/)
  })

  it('should include openGraph with type website and siteName', async () => {
    const metadata = await generateMetadata()

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      siteName: 'Test Site',
      locale: 'en_US',
    })
  })

  it('should include twitter card as summary_large_image', async () => {
    const metadata = await generateMetadata()

    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
    })
  })

  it('should still include title and description', async () => {
    const metadata = await generateMetadata()

    expect(metadata.title).toMatchObject({
      default: 'Test Site',
      template: '%s | Test Site',
    })
    expect(metadata.description).toBe('Test site description')
  })

  it('should return fallback metadataBase when fetchSiteInfo throws', async () => {
    const { fetchSiteInfo } = await import('@/lib/wordpress/site-info')
    vi.mocked(fetchSiteInfo).mockRejectedValueOnce(new Error('Network error'))

    const metadata = await generateMetadata()

    expect(metadata.metadataBase).toBeInstanceOf(URL)
  })
})
