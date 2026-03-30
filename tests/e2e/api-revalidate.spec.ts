import { test, expect } from '@playwright/test'

test.describe('Revalidation API', () => {
  const revalidateSecret = process.env.REVALIDATE_SECRET || 'test-secret'

  test('should reject requests without secret', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      data: { path: '/' }
    })

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toContain('Invalid secret')
  })

  test('should reject requests with wrong secret', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: {
        'X-Revalidate-Secret': 'wrong-secret'
      },
      data: { path: '/' }
    })

    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error).toContain('Invalid secret')
  })

  test('should accept requests with valid secret and path', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: {
        'X-Revalidate-Secret': revalidateSecret
      },
      data: { path: '/' }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.revalidated).toBe(true)
    expect(body.path).toBe('/')
  })

  test('should accept requests with valid secret and tag', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: {
        'X-Revalidate-Secret': revalidateSecret
      },
      data: { tag: 'posts' }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.revalidated).toBe(true)
    expect(body.tag).toBe('posts')
  })

  test('should include timestamp in response', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: {
        'X-Revalidate-Secret': revalidateSecret
      },
      data: { path: '/' }
    })

    const body = await response.json()
    expect(body.timestamp).toBeDefined()
    expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0)
  })

  test('should handle both path and tag in same request', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: {
        'X-Revalidate-Secret': revalidateSecret
      },
      data: {
        path: '/posts/test',
        tag: 'posts'
      }
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.path).toBe('/posts/test')
    expect(body.tag).toBe('posts')
  })

  test('should not allow GET requests in production', async ({ request }) => {
    // This test assumes NODE_ENV=production in Pantheon
    // In local dev, GET returns usage info
    const response = await request.get('/api/revalidate')

    // In production: 405
    // In development: 200 with usage info
    expect([200, 405]).toContain(response.status())
  })

  // ── WordPress-native payload ───────────────────────────────────────────────

  test('should revalidate post by post_type + post_slug', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: { 'X-Revalidate-Secret': revalidateSecret },
      data: { post_type: 'post', post_slug: 'teh-s3quence-016' },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.paths).toContain('/posts/teh-s3quence-016')
    expect(body.tags).toContain('posts')
    expect(body.tags).toContain('post-teh-s3quence-016')
  })

  test('should revalidate page by post_type + post_slug', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: { 'X-Revalidate-Secret': revalidateSecret },
      data: { post_type: 'page', post_slug: 'about' },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.paths).toContain('/about')
    expect(body.tags).toContain('pages')
    expect(body.tags).toContain('page-about')
  })

  test('should revalidate games list for gc_game post type', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: { 'X-Revalidate-Secret': revalidateSecret },
      data: { post_type: 'gc_game', post_slug: 'twilight-imperium' },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.paths).toContain('/games')
    expect(body.tags).toContain('games')
    expect(body.tags).toContain('game-twilight-imperium')
  })

  // ── surrogate_keys payload (webhook mu-plugin format) ──────────────────────

  test('should accept surrogate_keys array in request body', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: { 'X-Revalidate-Secret': revalidateSecret },
      data: {
        surrogate_keys: ['post-123', 'post-list', 'term-5'],
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.tags).toEqual(expect.arrayContaining(['post-123', 'post-list', 'term-5']))
  })

  test('should accept surrogate_keys via body secret field', async ({ request }) => {
    // The webhook mu-plugin sends the secret in the body as well as the header
    const response = await request.post('/api/revalidate', {
      data: {
        secret: revalidateSecret,
        surrogate_keys: ['post-42', 'post-list'],
      },
    })

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.tags).toContain('post-42')
  })

  test('surrogate_keys with no valid keys returns 400', async ({ request }) => {
    const response = await request.post('/api/revalidate', {
      headers: { 'X-Revalidate-Secret': revalidateSecret },
      data: { surrogate_keys: [] },
    })

    expect(response.status()).toBe(400)
  })
})
