import { describe, it, expect, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { fetchCategoryBySlug, WPNotFoundError, WPAPIError } from '@/lib/wordpress/client'

const API_URL = 'https://jazzsequence.com/wp-json/wp/v2'

const mockCategory = {
  id: 42,
  count: 12,
  description: 'Posts about music production and mixes',
  link: 'https://jazzsequence.com/category/music/',
  name: 'Music',
  slug: 'music',
  taxonomy: 'category',
  parent: 0,
  meta: {},
}

describe('fetchCategoryBySlug', () => {
  afterEach(() => server.resetHandlers())

  it('returns the category when found', async () => {
    server.use(
      http.get(`${API_URL}/categories`, () => HttpResponse.json([mockCategory]))
    )

    const category = await fetchCategoryBySlug('music')

    expect(category.id).toBe(42)
    expect(category.name).toBe('Music')
    expect(category.slug).toBe('music')
    expect(category.count).toBe(12)
    expect(category.taxonomy).toBe('category')
  })

  it('throws WPNotFoundError when no category matches the slug', async () => {
    server.use(
      http.get(`${API_URL}/categories`, () => HttpResponse.json([]))
    )

    await expect(fetchCategoryBySlug('nonexistent-category')).rejects.toThrow(WPNotFoundError)
  })

  it('throws WPAPIError on server error', async () => {
    server.use(
      http.get(`${API_URL}/categories`, () => HttpResponse.json({ message: 'Server Error' }, { status: 500 }))
    )

    await expect(fetchCategoryBySlug('music')).rejects.toThrow(WPAPIError)
  })
})
