import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the WordPress client before importing sitemap
vi.mock('@/lib/wordpress/client', () => ({
  fetchPostsWithPagination: vi.fn(),
}))

import { fetchPostsWithPagination } from '@/lib/wordpress/client'
import sitemap from '@/app/sitemap'

const mockFetch = fetchPostsWithPagination as ReturnType<typeof vi.fn>

const BASE_URL = 'https://jazzsequence.com'

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should include static routes', async () => {
    mockFetch.mockResolvedValue({ data: [], totalPages: 1, page: 1, perPage: 100, total: 0 })

    const result = await sitemap()
    const urls = result.map((entry) => entry.url)

    expect(urls).toContain(`${BASE_URL}/`)
    expect(urls).toContain(`${BASE_URL}/posts`)
    expect(urls).toContain(`${BASE_URL}/games`)
    expect(urls).toContain(`${BASE_URL}/media`)
  })

  it('should include post routes from WordPress', async () => {
    mockFetch.mockResolvedValue({
      data: [
        { slug: 'hello-world', date: '2024-01-01T00:00:00', modified: '2024-01-02T00:00:00' },
        { slug: 'second-post', date: '2024-02-01T00:00:00', modified: '2024-02-02T00:00:00' },
      ],
      totalPages: 1,
      page: 1,
      perPage: 100,
      total: 2,
    })

    const result = await sitemap()
    const urls = result.map((entry) => entry.url)

    expect(urls).toContain(`${BASE_URL}/posts/hello-world`)
    expect(urls).toContain(`${BASE_URL}/posts/second-post`)
  })

  it('should return static routes only when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('WordPress unreachable'))

    const result = await sitemap()
    const urls = result.map((entry) => entry.url)

    // Should still have static routes
    expect(urls).toContain(`${BASE_URL}/`)
    expect(urls).toContain(`${BASE_URL}/posts`)
    expect(urls).toContain(`${BASE_URL}/games`)
    expect(urls).toContain(`${BASE_URL}/media`)

    // Should not have any /posts/ routes
    const postRoutes = urls.filter((u) => u.includes('/posts/'))
    expect(postRoutes).toHaveLength(0)
  })

  it('should set lastModified from post modified date', async () => {
    mockFetch.mockResolvedValue({
      data: [
        { slug: 'my-post', date: '2024-01-01T00:00:00', modified: '2024-06-15T12:00:00' },
      ],
      totalPages: 1,
      page: 1,
      perPage: 100,
      total: 1,
    })

    const result = await sitemap()
    const postEntry = result.find((e) => e.url === `${BASE_URL}/posts/my-post`)

    expect(postEntry).toBeDefined()
    expect(postEntry?.lastModified).toBeInstanceOf(Date)
  })

  it('should call fetchPostsWithPagination with posts type and perPage 100', async () => {
    mockFetch.mockResolvedValue({ data: [], totalPages: 1, page: 1, perPage: 100, total: 0 })

    await sitemap()

    expect(mockFetch).toHaveBeenCalledWith('posts', expect.objectContaining({ perPage: 100 }))
  })
})
