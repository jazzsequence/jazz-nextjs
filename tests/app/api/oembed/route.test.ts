/**
 * /api/oembed route — server-side proxy for WordPress oEmbed endpoints.
 */

import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../mocks/server'
import { GET } from '@/app/api/oembed/route'

function makeRequest(url: string) {
  return new Request(`http://localhost:3000/api/oembed?url=${encodeURIComponent(url)}`)
}

const articleUrl = 'https://webdevstudios.com/2015/04/09/fundamentals-writing-clean-code/'

const oEmbedResponse = {
  version: '1.0',
  type: 'rich',
  title: 'The Fundamentals of Writing Clean Code',
  description: 'Core principles.',
  provider_name: 'WebDevStudios',
  provider_url: 'https://webdevstudios.com',
}

describe('GET /api/oembed', () => {
  it('returns 400 when no url param provided', async () => {
    const req = new Request('http://localhost:3000/api/oembed')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('fetches from the WordPress oEmbed endpoint for the given URL', async () => {
    let calledUrl: string | null = null
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', ({ request }) => {
        calledUrl = request.url
        return HttpResponse.json(oEmbedResponse)
      })
    )
    const req = makeRequest(articleUrl)
    await GET(req)
    expect(calledUrl).toContain('webdevstudios.com/wp-json/oembed/1.0/embed')
    expect(calledUrl).toContain(encodeURIComponent(articleUrl))
  })

  it('returns oEmbed JSON on success', async () => {
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', () =>
        HttpResponse.json(oEmbedResponse)
      )
    )
    const req = makeRequest(articleUrl)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(oEmbedResponse)
  })

  it('returns 502 when the external oEmbed endpoint returns an error', async () => {
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      )
    )
    const req = makeRequest(articleUrl)
    const res = await GET(req)
    expect(res.status).toBe(502)
  })

  it('returns 502 when fetch throws (network error)', async () => {
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', () =>
        HttpResponse.error()
      )
    )
    const req = makeRequest(articleUrl)
    const res = await GET(req)
    expect(res.status).toBe(502)
  })
})
