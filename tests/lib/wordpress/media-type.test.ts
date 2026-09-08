import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import {
  fetchMediaTypes,
  fetchPostsWithPagination,
  WPAPIError,
} from '@/lib/wordpress/client'
import type { WPMedia } from '@/lib/wordpress/types'

const API_URL = 'https://jazzsequence.com/wp-json/wp/v2'

const mockMediaTypes = [
  {
    id: 5319,
    count: 45,
    description: '',
    link: 'https://jazzsequence.com/media-type/podcast/',
    name: 'Podcast',
    slug: 'podcast',
    taxonomy: 'media_type',
    meta: [],
  },
  {
    id: 5321,
    count: 11,
    description: '',
    link: 'https://jazzsequence.com/media-type/video/',
    name: 'Video',
    slug: 'video',
    taxonomy: 'media_type',
    meta: {},
  },
]

describe('fetchMediaTypes', () => {
  afterEach(() => server.resetHandlers())

  it('returns every media_type term', async () => {
    server.use(
      http.get(`${API_URL}/media-type`, () => HttpResponse.json(mockMediaTypes))
    )

    const terms = await fetchMediaTypes()

    expect(terms).toHaveLength(2)
    expect(terms[0].slug).toBe('podcast')
    expect(terms[0].name).toBe('Podcast')
    expect(terms[0].id).toBe(5319)
    expect(terms[0].taxonomy).toBe('media_type')
  })

  it('requests all terms and excludes empty ones', async () => {
    let requestUrl = ''
    server.use(
      http.get(`${API_URL}/media-type`, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json(mockMediaTypes)
      })
    )

    await fetchMediaTypes()

    const params = new URL(requestUrl).searchParams
    expect(params.get('per_page')).toBe('100')
    expect(params.get('hide_empty')).toBe('true')
  })

  it('throws WPAPIError on server error', async () => {
    server.use(
      http.get(`${API_URL}/media-type`, () =>
        HttpResponse.json({ message: 'Server Error' }, { status: 500 })
      )
    )

    await expect(fetchMediaTypes()).rejects.toThrow(WPAPIError)
  })
})

describe('mediaTypes fetch option', () => {
  afterEach(() => server.resetHandlers())

  it('appends the media-type query parameter for the media CPT', async () => {
    let requestUrl = ''
    server.use(
      http.get(`${API_URL}/media-items`, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json([], {
          headers: { 'X-WP-Total': '0', 'X-WP-TotalPages': '0' },
        })
      })
    )

    await fetchPostsWithPagination<WPMedia>('media', { mediaTypes: [5319] })

    expect(new URL(requestUrl).searchParams.get('media-type')).toBe('5319')
  })

  it('joins multiple media type ids with a comma', async () => {
    let requestUrl = ''
    server.use(
      http.get(`${API_URL}/media-items`, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json([], {
          headers: { 'X-WP-Total': '0', 'X-WP-TotalPages': '0' },
        })
      })
    )

    await fetchPostsWithPagination<WPMedia>('media', { mediaTypes: [5319, 5321] })

    expect(new URL(requestUrl).searchParams.get('media-type')).toBe('5319,5321')
  })

  it('omits the media-type parameter when no filter is given', async () => {
    let requestUrl = ''
    server.use(
      http.get(`${API_URL}/media-items`, ({ request }) => {
        requestUrl = request.url
        return HttpResponse.json([], {
          headers: { 'X-WP-Total': '0', 'X-WP-TotalPages': '0' },
        })
      })
    )

    await fetchPostsWithPagination<WPMedia>('media', {})

    expect(new URL(requestUrl).searchParams.has('media-type')).toBe(false)
  })
})
