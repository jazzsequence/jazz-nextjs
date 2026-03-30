import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config'

/**
 * Validates that next.config.ts correctly sets Surrogate-Control headers
 * for Pantheon GCDN (Fastly) edge caching.
 *
 * Fastly uses Surrogate-Control for its own TTL decisions and strips it
 * before forwarding to the browser — so this is only testable at the config
 * level, not via HTTP response inspection through the CDN.
 */
describe('next.config.ts headers()', () => {
  it('sets Surrogate-Control: max-age=31536000 for page routes', async () => {
    const headers = await nextConfig.headers!()
    const rule = headers.find(h =>
      h.source.includes('(?!api') &&
      h.source.includes('_next') &&
      h.source.includes('search')
    )
    expect(rule).toBeDefined()
    const sc = rule!.headers.find(h => h.key === 'Surrogate-Control')
    expect(sc?.value).toBe('max-age=31536000')
  })

  it('sets Cache-Control: s-maxage=31536000 for page routes', async () => {
    // Needed as a fallback: Next.js skips assigning no-store when Cache-Control
    // is already present (checked in app-page.js before rendering). This ensures
    // any route that remains dynamic still gets cacheable headers at the CDN.
    const headers = await nextConfig.headers!()
    const rule = headers.find(h =>
      h.source.includes('(?!api') &&
      h.source.includes('_next') &&
      h.source.includes('search')
    )
    expect(rule).toBeDefined()
    const cc = rule!.headers.find(h => h.key === 'Cache-Control')
    expect(cc?.value).toMatch(/s-maxage=/)
  })

  it('excludes /api routes from Surrogate-Control', async () => {
    const headers = await nextConfig.headers!()
    const rule = headers.find(h => h.headers.some(h => h.key === 'Surrogate-Control'))
    expect(rule).toBeDefined()
    // Negative lookahead excludes api paths
    expect(rule!.source).toContain('(?!api')
  })

  it('excludes /search from Surrogate-Control', async () => {
    const headers = await nextConfig.headers!()
    const rule = headers.find(h => h.headers.some(h => h.key === 'Surrogate-Control'))
    expect(rule!.source).toContain('search')
  })

  it('excludes /_next internals from Surrogate-Control', async () => {
    const headers = await nextConfig.headers!()
    const rule = headers.find(h => h.headers.some(h => h.key === 'Surrogate-Control'))
    expect(rule!.source).toContain('_next')
  })
})
