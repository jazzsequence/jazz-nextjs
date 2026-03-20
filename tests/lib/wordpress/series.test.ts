import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchSeriesBySlug, WPNotFoundError, WPAPIError } from '@/lib/wordpress/client'

const API_URL = 'https://jazzsequence.com/wp-json/wp/v2'

const mockSeries = {
  id: 42,
  count: 21,
  description: 'Posts about artificial intelligence',
  link: 'https://jazzsequence.com/series/artificial-intelligence/',
  name: 'Artificial Intelligence',
  slug: 'artificial-intelligence',
  taxonomy: 'series',
  meta: {},
}

describe('fetchSeriesBySlug', () => {
  afterEach(() => server.resetHandlers())

  it('returns the series when found', async () => {
    server.use(
      http.get(`${API_URL}/series`, () => HttpResponse.json([mockSeries]))
    )

    const series = await fetchSeriesBySlug('artificial-intelligence')

    expect(series.id).toBe(42)
    expect(series.name).toBe('Artificial Intelligence')
    expect(series.slug).toBe('artificial-intelligence')
    expect(series.count).toBe(21)
    expect(series.taxonomy).toBe('series')
  })

  it('throws WPNotFoundError when no series matches the slug', async () => {
    server.use(
      http.get(`${API_URL}/series`, () => HttpResponse.json([]))
    )

    await expect(fetchSeriesBySlug('nonexistent-series')).rejects.toThrow(WPNotFoundError)
  })

  it('throws WPAPIError on server error', async () => {
    server.use(
      http.get(`${API_URL}/series`, () => HttpResponse.json({ message: 'Server Error' }, { status: 500 }))
    )

    await expect(fetchSeriesBySlug('artificial-intelligence')).rejects.toThrow(WPAPIError)
  })
})
