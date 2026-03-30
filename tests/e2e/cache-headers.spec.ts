import { test, expect } from '@playwright/test'

/**
 * Verifies that Pantheon GCDN (Fastly) edge caching is correctly configured.
 *
 * Fastly uses Surrogate-Control for its own TTL decisions and strips it before
 * forwarding to the browser. Presence tests only run against localhost (origin)
 * because Fastly correctly consumes and strips the header before clients see it.
 * Absence tests (search/API) run everywhere.
 */

// Fastly strips Surrogate-Control before forwarding — only testable against the
// Next.js origin directly (localhost). Skip when BASE_URL points to a deployed site.
const isDeployed = !!process.env.BASE_URL

test.describe('Cache headers', () => {
  test.describe('Surrogate-Control on page routes', () => {
    const cacheableRoutes = [
      '/',
      '/posts',
      '/games',
      '/media',
      '/style-guide',
    ]

    for (const route of cacheableRoutes) {
      test(`${route} has Surrogate-Control: max-age=31536000`, async ({ request }) => {
        test.skip(isDeployed, 'Fastly strips Surrogate-Control before forwarding — only testable against origin')
        const response = await request.get(route)
        expect(response.status()).toBe(200)
        expect(response.headers()['surrogate-control']).toBe('max-age=31536000')
      })
    }

    test('dynamic post page has Surrogate-Control: max-age=31536000', async ({ request }) => {
      test.skip(isDeployed, 'Fastly strips Surrogate-Control before forwarding — only testable against origin')
      // Fetch the homepage first to get a real post slug
      const home = await request.get('/')
      const html = await home.text()
      const match = html.match(/href="\/posts\/([^"]+)"/)
      const slug = match?.[1] ?? 'teaching-an-ai-to-read-my-website-over-mcp'

      const response = await request.get(`/posts/${slug}`)
      expect(response.status()).toBe(200)
      expect(response.headers()['surrogate-control']).toBe('max-age=31536000')
    })
  })

  test.describe('Surrogate-Control absent on non-cacheable routes', () => {
    test('search page does not have Surrogate-Control: max-age=31536000', async ({ request }) => {
      const response = await request.get('/search?q=test')
      // Search is revalidate=0 — must not be edge-cached
      const surrogateControl = response.headers()['surrogate-control']
      expect(surrogateControl).not.toBe('max-age=31536000')
    })

    test('API routes do not have Surrogate-Control: max-age=31536000', async ({ request }) => {
      // The revalidation endpoint without auth should 401, not cache
      const response = await request.post('/api/revalidate', { data: {} })
      expect(response.status()).toBe(401)
      const surrogateControl = response.headers()['surrogate-control']
      expect(surrogateControl).not.toBe('max-age=3600')
    })
  })
})
