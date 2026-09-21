import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchSiteInfo, fetchSiteIcon, buildIconResponse, resolveIconResponse } from '@/lib/wordpress/site-info'

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

describe('fetchSiteIcon', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the 32/180 sub-sizes when the media lookup succeeds', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ site_icon: 16520, site_icon_url: 'https://example.com/full.jpg' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          media_details: {
            sizes: {
              'site_icon-32': { source_url: 'https://example.com/icon-32.jpg' },
              'site_icon-180': { source_url: 'https://example.com/icon-180.jpg' },
            },
          },
        }),
      })

    const result = await fetchSiteIcon()

    expect(result).toEqual({ small: 'https://example.com/icon-32.jpg', medium: 'https://example.com/icon-180.jpg' })
  })

  it('falls back to the full-crop URL when the media lookup has no sub-sizes', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ site_icon: 16520, site_icon_url: 'https://example.com/full.jpg' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ media_details: { sizes: {} } }) })

    const result = await fetchSiteIcon()

    expect(result).toEqual({ small: 'https://example.com/full.jpg', medium: 'https://example.com/full.jpg' })
  })

  it('falls back to the full-crop URL when the media lookup request fails', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ site_icon: 16520, site_icon_url: 'https://example.com/full.jpg' }) })
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' })

    const result = await fetchSiteIcon()

    expect(result).toEqual({ small: 'https://example.com/full.jpg', medium: 'https://example.com/full.jpg' })
  })

  it('returns null when no Site Icon is configured', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ site_icon: 0, site_icon_url: undefined }) })

    const result = await fetchSiteIcon()

    expect(result).toBeNull()
  })

  it('throws on non-OK root response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' })

    await expect(fetchSiteIcon()).rejects.toThrow()
  })
})

describe('buildIconResponse', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('serves the image with the upstream response\'s own Content-Type', async () => {
    const imageBytes = new Uint8Array([1, 2, 3]).buffer
    global.fetch = vi.fn().mockResolvedValue({
      arrayBuffer: async () => imageBytes,
      headers: new Headers({ 'content-type': 'image/png' }),
    })

    const response = await buildIconResponse('https://example.com/icon.png', 'image/jpeg')

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/icon.png', expect.anything())
    expect(response.headers.get('Content-Type')).toBe('image/png')
  })

  it('falls back to the given content type if the upstream response omits one', async () => {
    const imageBytes = new Uint8Array([1, 2, 3]).buffer
    global.fetch = vi.fn().mockResolvedValue({ arrayBuffer: async () => imageBytes, headers: new Headers() })

    const response = await buildIconResponse('https://example.com/icon.jpg', 'image/jpeg')

    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
  })
})

describe('resolveIconResponse', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('resolves the real Site Icon when WordPress is reachable', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ site_icon: 16520, site_icon_url: 'https://example.com/full.jpg' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          media_details: {
            sizes: {
              'site_icon-32': { source_url: 'https://example.com/icon-32.jpg' },
              'site_icon-180': { source_url: 'https://example.com/icon-180.jpg' },
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
      })

    const response = await resolveIconResponse('small', 'image/jpeg')

    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('falls back to a transparent pixel when no Site Icon is configured', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ site_icon: 0, site_icon_url: undefined }) })

    const response = await resolveIconResponse('small', 'image/jpeg')

    expect(response.headers.get('Content-Type')).toBe('image/png')
  })

  it('falls back to a transparent pixel when WordPress is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'))

    const response = await resolveIconResponse('small', 'image/jpeg')

    expect(response.headers.get('Content-Type')).toBe('image/png')
  })

  it('never throws, regardless of failure mode', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(resolveIconResponse('medium', 'image/jpeg')).resolves.toBeInstanceOf(Response)
  })
})
