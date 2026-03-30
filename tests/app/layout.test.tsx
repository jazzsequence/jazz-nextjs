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

import fs from 'fs'
import path from 'path'
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

describe('layout.tsx Font Awesome font-display override', () => {
  // jsDelivr's all.min.css uses font-display: block (the default) which causes
  // CLS as the icon fonts load. We override with font-display: optional via an
  // inline <style> placed AFTER the jsDelivr <link> so it wins the cascade.
  it('layout.tsx source contains @font-face overrides with font-display: optional after the jsDelivr link', () => {
    const layoutSrc = fs.readFileSync(
      path.resolve(__dirname, '../../app/layout.tsx'),
      'utf8'
    )
    // Verify jsDelivr link is present
    expect(layoutSrc).toContain('cdn.jsdelivr.net')
    // Verify font-display: optional override exists
    expect(layoutSrc).toContain('font-display: optional')
    // Verify the override appears AFTER the jsDelivr stylesheet link
    const jsDelivrPos = layoutSrc.indexOf('cdn.jsdelivr.net')
    const fontDisplayPos = layoutSrc.indexOf('font-display: optional')
    expect(fontDisplayPos).toBeGreaterThan(jsDelivrPos)
  })

  it('globals.css does not contain competing FA @font-face swap declarations', () => {
    // The globals.css bundle loads before jsDelivr — any @font-face there
    // would be overridden by jsDelivr's block declaration in Chromium.
    // Overrides live in layout.tsx inline <style> which loads after jsDelivr.
    const globalsSrc = fs.readFileSync(
      path.resolve(__dirname, '../../app/globals.css'),
      'utf8'
    )
    expect(globalsSrc).not.toContain('font-display: swap')
    expect(globalsSrc).not.toContain('"Font Awesome 6 Free"')
    expect(globalsSrc).not.toContain('"Font Awesome 6 Brands"')
  })
})

describe('package.json browserslist', () => {
  it('defines a modern browserslist target to avoid shipping unnecessary polyfills', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
    )
    expect(pkg.browserslist).toBeDefined()
    // Should target modern browsers — no IE 11, no dead browsers
    const list = Array.isArray(pkg.browserslist) ? pkg.browserslist.join(' ') : JSON.stringify(pkg.browserslist)
    expect(list).not.toMatch(/ie\s*11/i)
  })
})
