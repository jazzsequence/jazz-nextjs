import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchTagBySlug, WPNotFoundError, WPAPIError } from '@/lib/wordpress/client'

const API_URL = 'https://jazzsequence.com/wp-json/wp/v2'

const mockTag = {
  id: 273,
  count: 19,
  description: '',
  link: 'https://jazzsequence.com/tag/teh-s3quence/',
  name: 'teh s3quence',
  slug: 'teh-s3quence',
  taxonomy: 'post_tag',
  meta: {},
}

describe('fetchTagBySlug', () => {
  afterEach(() => server.resetHandlers())

  it('returns the tag when found', async () => {
    server.use(
      http.get(`${API_URL}/tags`, () => HttpResponse.json([mockTag]))
    )

    const tag = await fetchTagBySlug('teh-s3quence')

    expect(tag.id).toBe(273)
    expect(tag.name).toBe('teh s3quence')
    expect(tag.slug).toBe('teh-s3quence')
    expect(tag.count).toBe(19)
    expect(tag.taxonomy).toBe('post_tag')
  })

  it('throws WPNotFoundError when no tag matches the slug', async () => {
    server.use(
      http.get(`${API_URL}/tags`, () => HttpResponse.json([]))
    )

    await expect(fetchTagBySlug('nonexistent-tag')).rejects.toThrow(WPNotFoundError)
  })

  it('throws WPAPIError on server error', async () => {
    server.use(
      http.get(`${API_URL}/tags`, () => HttpResponse.json({ message: 'Server Error' }, { status: 500 }))
    )

    await expect(fetchTagBySlug('teh-s3quence')).rejects.toThrow(WPAPIError)
  })
})
