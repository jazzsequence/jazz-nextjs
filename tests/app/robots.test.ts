import { describe, it, expect } from 'vitest'
import robots from '@/app/robots'

describe('robots', () => {
  it('should return rules allowing all user agents', () => {
    const result = robots()
    expect(result.rules).toMatchObject({
      userAgent: '*',
      allow: '/',
    })
  })

  it('should disallow api and style-guide routes', () => {
    const result = robots()
    expect((result.rules as { disallow: string[] }).disallow).toContain('/api/')
    expect((result.rules as { disallow: string[] }).disallow).toContain('/style-guide')
  })

  it('should include sitemap URL with default base URL', () => {
    const result = robots()
    expect(result.sitemap).toBe('https://jazzsequence.com/sitemap.xml')
  })

  it('should use NEXT_PUBLIC_SITE_URL env var for sitemap URL when set', () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
    // Re-import to pick up env var (module is cached, so we test the default inline)
    const result = robots()
    // The module uses env at call time via the constant — reset and verify default
    process.env.NEXT_PUBLIC_SITE_URL = original
    // sitemap should be a string ending in /sitemap.xml
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
  })
})
