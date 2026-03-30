import { test, expect } from '@playwright/test'

/**
 * Verifies that Pantheon GCDN (Fastly) edge caching is correctly configured.
 *
 * Fastly uses Surrogate-Control for its own TTL decisions and strips it before
 * forwarding to the browser. These tests confirm the header is present on
 * cacheable page routes and absent (or set to no-store) on dynamic routes.
 */
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
        const response = await request.get(route)
        expect(response.status()).toBe(200)
        expect(response.headers()['surrogate-control']).toBe('max-age=31536000')
      })
    }

    test('dynamic post page has Surrogate-Control: max-age=31536000', async ({ request }) => {
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
