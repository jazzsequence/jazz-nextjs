import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchSiteInfo } from '@/lib/wordpress/site-info'

const mockSiteInfo = {
  name: 'jazzsequence',
  description: 'music, code, games, and other things',
  url: 'https://jazzsequence.com',
  home: 'https://jazzsequence.com',
  gmt_offset: -7,
  timezone_string: 'America/Denver',
}

describe('fetchSiteInfo', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns site name and description from WordPress root API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSiteInfo,
    })

    const result = await fetchSiteInfo()

    expect(result.name).toBe('jazzsequence')
    expect(result.description).toBe('music, code, games, and other things')
  })

  it('calls the WordPress root endpoint (no version prefix)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSiteInfo,
    })

    await fetchSiteInfo()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/wp-json'),
      expect.objectContaining({ next: expect.objectContaining({ revalidate: 3600 }) })
    )
  })

  it('throws on non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(fetchSiteInfo()).rejects.toThrow()
  })

  it('falls back gracefully on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(fetchSiteInfo()).rejects.toThrow('Network error')
  })
})
