import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../mocks/server'

import { POST } from '@/app/api/contact/route'

const WP_CONTACT_URL = 'https://jazzsequence.com/wp-json/jazz-nextjs/v1/contact'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.WORDPRESS_API_URL = 'https://jazzsequence.com/wp-json/wp/v2'
  process.env.WORDPRESS_USERNAME = 'test-user'
  process.env.WORDPRESS_APP_PASSWORD = 'test-password'
})

describe('POST /api/contact', () => {
  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({ email: 'test@example.com', message: 'Hello' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/name/i)
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({ name: 'Chris', message: 'Hello' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  it('returns 400 when message is missing', async () => {
    const res = await POST(makeRequest({ name: 'Chris', email: 'test@example.com' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/message/i)
  })

  it('returns 400 for invalid email format', async () => {
    const res = await POST(makeRequest({ name: 'Chris', email: 'not-an-email', message: 'Hello' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  it('returns 200 when WordPress accepts the submission', async () => {
    server.use(
      http.post(WP_CONTACT_URL, () => HttpResponse.json({ success: true }))
    )

    const res = await POST(makeRequest({ name: 'Chris', email: 'chris@example.com', message: 'Hello there' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('sends Authorization header to WordPress (credentials never exposed to browser)', async () => {
    let capturedAuth: string | null = null

    server.use(
      http.post(WP_CONTACT_URL, ({ request }) => {
        capturedAuth = request.headers.get('authorization')
        return HttpResponse.json({ success: true })
      })
    )

    await POST(makeRequest({ name: 'Chris', email: 'chris@example.com', message: 'Hello' }))
    expect(capturedAuth).toMatch(/^Basic /)
  })

  it('returns 502 when WordPress returns an error', async () => {
    server.use(
      http.post(WP_CONTACT_URL, () => HttpResponse.json({ message: 'Server error' }, { status: 500 }))
    )

    const res = await POST(makeRequest({ name: 'Chris', email: 'chris@example.com', message: 'Hello' }))
    expect(res.status).toBe(502)
  })

  it('returns 502 when WordPress is unreachable', async () => {
    server.use(
      http.post(WP_CONTACT_URL, () => HttpResponse.error())
    )

    const res = await POST(makeRequest({ name: 'Chris', email: 'chris@example.com', message: 'Hello' }))
    expect(res.status).toBe(502)
  })

  it('returns 500 when WordPress credentials are not configured', async () => {
    const savedUsername = process.env.WORDPRESS_USERNAME
    const savedPassword = process.env.WORDPRESS_APP_PASSWORD
    delete process.env.WORDPRESS_USERNAME
    delete process.env.WORDPRESS_APP_PASSWORD

    try {
      const res = await POST(makeRequest({ name: 'Chris', email: 'chris@example.com', message: 'Hello' }))
      expect(res.status).toBe(500)
    } finally {
      process.env.WORDPRESS_USERNAME = savedUsername
      process.env.WORDPRESS_APP_PASSWORD = savedPassword
    }
  })

  it('silently accepts (returns 200) when honeypot field is filled — discourages bot retries', async () => {
    let wordPressCalled = false
    server.use(
      http.post(WP_CONTACT_URL, () => {
        wordPressCalled = true
        return HttpResponse.json({ success: true })
      })
    )

    const res = await POST(makeRequest({
      name: 'Bot',
      email: 'bot@spam.com',
      message: 'Buy now!',
      website: 'http://spam.com',
    }))
    expect(res.status).toBe(200)
    expect(wordPressCalled).toBe(false)
  })

  it('does not include WordPress credentials in the response body', async () => {
    server.use(
      http.post(WP_CONTACT_URL, () => HttpResponse.json({ success: true }))
    )

    const res = await POST(makeRequest({ name: 'Chris', email: 'chris@example.com', message: 'Hello' }))
    const text = await res.text()
    expect(text).not.toContain('test-password')
    expect(text).not.toContain('test-user')
  })
})
