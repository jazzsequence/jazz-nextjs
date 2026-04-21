import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../mocks/server'

const WP_COMMENTS_URL = 'https://jazzsequence.com/wp-json/wp/v2/comments'

// Lazy import so env vars are set before the module resolves
async function importRoute() {
  return import('@/app/api/comments/route')
}

function getRequest(postId: number | string): Request {
  return new Request(`http://localhost/api/comments?postId=${postId}`)
}

function postRequest(body: unknown): Request {
  return new Request('http://localhost/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  process.env.WORDPRESS_API_URL = 'https://jazzsequence.com/wp-json/wp/v2'
})

const mockComment = {
  id: 1,
  post: 42,
  parent: 0,
  author: 0,
  author_name: 'Alice',
  author_url: '',
  date: '2026-01-01T10:00:00',
  date_gmt: '2026-01-01T10:00:00',
  content: { rendered: '<p>Hello</p>' },
  link: 'https://example.com/#comment-1',
  status: 'approved',
  type: 'comment',
  author_avatar_urls: { '48': 'https://gravatar.com/avatar/00000000' },
}

// ── GET /api/comments ──────────────────────────────────────────────────────────

describe('GET /api/comments', () => {
  it('returns 400 when postId is missing', async () => {
    const { GET } = await importRoute()
    const res = await GET(new Request('http://localhost/api/comments'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/postId/i)
  })

  it('returns 400 for a non-numeric postId', async () => {
    const { GET } = await importRoute()
    const res = await GET(getRequest('abc'))
    expect(res.status).toBe(400)
  })

  it('fetches approved comments from WordPress for the given postId', async () => {
    let capturedUrl = ''
    server.use(
      http.get(WP_COMMENTS_URL, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([mockComment])
      })
    )

    const { GET } = await importRoute()
    const res = await GET(getRequest(42))
    expect(res.status).toBe(200)
    expect(capturedUrl).toContain('post=42')
    expect(capturedUrl).toContain('status=approved')
  })

  it('returns the comments array', async () => {
    server.use(http.get(WP_COMMENTS_URL, () => HttpResponse.json([mockComment])))

    const { GET } = await importRoute()
    const res = await GET(getRequest(42))
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(1)
    expect(body[0].id).toBe(1)
  })

  it('sanitizes comment HTML content', async () => {
    server.use(http.get(WP_COMMENTS_URL, () => HttpResponse.json([{
      ...mockComment,
      content: { rendered: '<p>Safe</p><script>alert("xss")</script>' },
    }])))

    const { GET } = await importRoute()
    const res = await GET(getRequest(42))
    const body = await res.json()
    expect(body[0].content.rendered).not.toContain('<script>')
    expect(body[0].content.rendered).toContain('Safe')
  })

  it('returns 502 when WordPress is unreachable', async () => {
    server.use(http.get(WP_COMMENTS_URL, () => HttpResponse.error()))

    const { GET } = await importRoute()
    const res = await GET(getRequest(42))
    expect(res.status).toBe(502)
  })

  it('returns empty array when WordPress returns 404 (no comments)', async () => {
    server.use(http.get(WP_COMMENTS_URL, () => new HttpResponse(null, { status: 404 })))

    const { GET } = await importRoute()
    const res = await GET(getRequest(42))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })
})

// ── POST /api/comments ─────────────────────────────────────────────────────────

describe('POST /api/comments', () => {
  it('returns 400 when author_name is missing', async () => {
    const { POST } = await importRoute()
    const res = await POST(postRequest({ post: 42, author_email: 'a@b.com', content: 'Hello' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/name/i)
  })

  it('returns 400 when author_email is missing', async () => {
    const { POST } = await importRoute()
    const res = await POST(postRequest({ post: 42, author_name: 'Alice', content: 'Hello' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  it('returns 400 when content is missing', async () => {
    const { POST } = await importRoute()
    const res = await POST(postRequest({ post: 42, author_name: 'Alice', author_email: 'a@b.com' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/content/i)
  })

  it('returns 400 when post ID is missing', async () => {
    const { POST } = await importRoute()
    const res = await POST(postRequest({ author_name: 'Alice', author_email: 'a@b.com', content: 'Hello' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid email format', async () => {
    const { POST } = await importRoute()
    const res = await POST(postRequest({ post: 42, author_name: 'Alice', author_email: 'not-email', content: 'Hello' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  it('forwards valid submission to WordPress', async () => {
    let capturedBody: Record<string, unknown> = {}
    server.use(http.post(WP_COMMENTS_URL, async ({ request }) => {
      capturedBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ ...mockComment, status: 'hold' }, { status: 201 })
    }))

    const { POST } = await importRoute()
    const res = await POST(postRequest({
      post: 42,
      author_name: 'Alice',
      author_email: 'alice@example.com',
      content: 'Great post!',
    }))
    expect(res.status).toBe(201)
    expect(capturedBody.post).toBe(42)
    expect(capturedBody.author_name).toBe('Alice')
    expect(capturedBody.author_email).toBe('alice@example.com')
    expect(capturedBody.content).toBe('Great post!')
  })

  it('does not forward the honeypot website field to WordPress', async () => {
    let capturedBody: Record<string, unknown> = {}
    server.use(http.post(WP_COMMENTS_URL, async ({ request }) => {
      capturedBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ ...mockComment, status: 'hold' }, { status: 201 })
    }))

    const { POST } = await importRoute()
    await POST(postRequest({
      post: 42,
      author_name: 'Alice',
      author_email: 'alice@example.com',
      content: 'Hello',
      website: '',
    }))
    expect(capturedBody).not.toHaveProperty('website')
  })

  it('silently returns 200 when honeypot is filled (bot suppression)', async () => {
    let wpCalled = false
    server.use(http.post(WP_COMMENTS_URL, () => {
      wpCalled = true
      return HttpResponse.json({ id: 1 }, { status: 201 })
    }))

    const { POST } = await importRoute()
    const res = await POST(postRequest({
      post: 42,
      author_name: 'Bot',
      author_email: 'bot@spam.com',
      content: 'Buy now!',
      website: 'http://spam.com',
    }))
    expect(res.status).toBe(200)
    expect(wpCalled).toBe(false)
  })

  it('returns 403 when WordPress rejects the comment (closed comments)', async () => {
    server.use(http.post(WP_COMMENTS_URL, () =>
      HttpResponse.json({ code: 'comment_closed', message: 'Comments are closed.' }, { status: 403 })
    ))

    const { POST } = await importRoute()
    const res = await POST(postRequest({
      post: 42,
      author_name: 'Alice',
      author_email: 'alice@example.com',
      content: 'Hello',
    }))
    expect(res.status).toBe(403)
  })

  it('returns 502 when WordPress is unreachable', async () => {
    server.use(http.post(WP_COMMENTS_URL, () => HttpResponse.error()))

    const { POST } = await importRoute()
    const res = await POST(postRequest({
      post: 42,
      author_name: 'Alice',
      author_email: 'alice@example.com',
      content: 'Hello',
    }))
    expect(res.status).toBe(502)
  })
})
