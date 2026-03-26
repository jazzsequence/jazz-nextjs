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
        // Return with thumbnail_url so the route returns early without fetching the page
        return HttpResponse.json({ ...oEmbedResponse, thumbnail_url: 'https://webdevstudios.com/thumb.jpg' })
      })
    )
    const req = makeRequest(articleUrl)
    await GET(req)
    expect(calledUrl).toContain('webdevstudios.com/wp-json/oembed/1.0/embed')
    expect(calledUrl).toContain(encodeURIComponent(articleUrl))
  })

  it('returns oEmbed JSON immediately when it includes thumbnail_url', async () => {
    const withThumb = { ...oEmbedResponse, thumbnail_url: 'https://webdevstudios.com/thumb.jpg' }
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', () =>
        HttpResponse.json(withThumb)
      )
    )
    const req = makeRequest(articleUrl)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(withThumb)
  })

  it('augments oEmbed data with OG image when oEmbed has no thumbnail_url', async () => {
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', () =>
        HttpResponse.json(oEmbedResponse) // no thumbnail_url
      ),
      http.get(articleUrl, () =>
        HttpResponse.html(`<!DOCTYPE html><html><head>
          <meta property="og:image" content="https://webdevstudios.com/og-image.jpg" />
        </head><body></body></html>`)
      )
    )
    const req = makeRequest(articleUrl)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    // Should have oEmbed title/description AND the OG image
    expect(data.title).toBe(oEmbedResponse.title)
    expect(data.thumbnail_url).toBe('https://webdevstudios.com/og-image.jpg')
  })

  it('falls back to OG metadata when oEmbed endpoint returns 404', async () => {
    const pantheonUrl = 'https://pantheon.io/blog/why-wordpress-multisite'
    server.use(
      http.get('https://pantheon.io/wp-json/oembed/1.0/embed', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      ),
      http.get('https://pantheon.io/blog/why-wordpress-multisite', () =>
        HttpResponse.html(`<!DOCTYPE html><html>
          <head>
            <meta property="og:title" content="Why WordPress Multisite" />
            <meta property="og:description" content="Demystifying the WordPress core feature." />
            <meta property="og:image" content="https://pantheon.io/img/multisite-thumb.jpg" />
            <meta property="og:site_name" content="Pantheon" />
          </head><body></body></html>`)
      )
    )
    const req = makeRequest(pantheonUrl)
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.title).toBe('Why WordPress Multisite')
    expect(data.description).toBe('Demystifying the WordPress core feature.')
    expect(data.thumbnail_url).toBe('https://pantheon.io/img/multisite-thumb.jpg')
    expect(data.provider_name).toBe('Pantheon')
    expect(data.provider_url).toBe('https://pantheon.io')
  })

  it('returns 502 when oEmbed fails and OG meta fetch also fails', async () => {
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      ),
      http.get(articleUrl, () => HttpResponse.error())
    )
    const req = makeRequest(articleUrl)
    const res = await GET(req)
    expect(res.status).toBe(502)
  })

  it('returns 502 when the external oEmbed endpoint returns an error and no OG meta exists', async () => {
    server.use(
      http.get('https://webdevstudios.com/wp-json/oembed/1.0/embed', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 })
      ),
      http.get(articleUrl, () =>
        HttpResponse.html('<!DOCTYPE html><html><head></head><body></body></html>')
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
      ),
      http.get(articleUrl, () => HttpResponse.error())
    )
    const req = makeRequest(articleUrl)
    const res = await GET(req)
    expect(res.status).toBe(502)
  })
})

describe('GET /api/oembed — internal /posts/[slug] URLs', () => {
  const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL ?? 'https://jazzsequence.com/wp-json/wp/v2'

  it('fetches featured image from WordPress REST API for /posts/[slug] URLs', async () => {
    server.use(
      http.get(`${WORDPRESS_API_URL}/posts`, () =>
        HttpResponse.json([{
          title: { rendered: 'WordPress 5.9: Full Site Editing Is Here' },
          excerpt: { rendered: '<p>Full site editing coverage.</p>' },
          _embedded: {
            'wp:featuredmedia': [{ source_url: 'https://example.com/wp59-thumb.jpg' }],
          },
        }])
      )
    )
    const req = new Request('http://localhost:3000/api/oembed?url=/posts/wordpress-5-9-full-site-editing-is-here')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.thumbnail_url).toBe('https://example.com/wp59-thumb.jpg')
    expect(data.title).toBe('WordPress 5.9: Full Site Editing Is Here')
    expect(data.provider_name).toBe('jazzsequence.com')
  })

  it('returns 502 when WordPress API returns no matching post', async () => {
    server.use(
      http.get(`${WORDPRESS_API_URL}/posts`, () => HttpResponse.json([]))
    )
    const req = new Request('http://localhost:3000/api/oembed?url=/posts/nonexistent-post')
    const res = await GET(req)
    expect(res.status).toBe(502)
  })
})
