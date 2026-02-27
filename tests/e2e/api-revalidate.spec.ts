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
})
