import { describe, it, expect, vi, beforeEach } from 'vitest'
import { size, contentType } from '@/app/apple-icon'
import * as siteInfo from '@/lib/wordpress/site-info'

vi.mock('@/lib/wordpress/site-info', () => ({
  resolveIconResponse: vi.fn(),
}))

describe('app/apple-icon', () => {
  it('exports the correct dimensions', () => {
    expect(size).toEqual({ width: 180, height: 180 })
  })

  it('exports a content type hint', () => {
    expect(contentType).toBe('image/jpeg')
  })
})

describe('app/apple-icon default export', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('resolves the medium Site Icon response', async () => {
    const fakeResponse = new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/jpeg' } })
    vi.mocked(siteInfo.resolveIconResponse).mockResolvedValue(fakeResponse)

    const { default: AppleIcon } = await import('@/app/apple-icon')
    const response = await AppleIcon()

    expect(siteInfo.resolveIconResponse).toHaveBeenCalledWith('medium', 'image/jpeg')
    expect(response).toBe(fakeResponse)
  })
})
