import { describe, it, expect, vi, beforeEach } from 'vitest'
import { size, contentType } from '@/app/icon'
import * as siteInfo from '@/lib/wordpress/site-info'

vi.mock('@/lib/wordpress/site-info', () => ({
  resolveIconResponse: vi.fn(),
}))

describe('app/icon', () => {
  it('exports the correct dimensions', () => {
    expect(size).toEqual({ width: 32, height: 32 })
  })

  it('exports a content type hint', () => {
    expect(contentType).toBe('image/jpeg')
  })
})

describe('app/icon default export', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('resolves the small Site Icon response', async () => {
    const fakeResponse = new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/jpeg' } })
    vi.mocked(siteInfo.resolveIconResponse).mockResolvedValue(fakeResponse)

    const { default: Icon } = await import('@/app/icon')
    const response = await Icon()

    expect(siteInfo.resolveIconResponse).toHaveBeenCalledWith('small', 'image/jpeg')
    expect(response).toBe(fakeResponse)
  })
})
