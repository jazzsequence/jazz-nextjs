import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

import { headers } from 'next/headers'
import { GET } from '@/app/api/country/route'

type MockHeaders = { get: (name: string) => string | null }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/country', () => {
  it('returns cf-ipcountry when present (Cloudflare / Pantheon GCDN future)', async () => {
    vi.mocked(headers).mockResolvedValue({ get: (n) => n === 'cf-ipcountry' ? 'CN' : null } as MockHeaders)
    const res = await GET()
    expect(await res.json()).toEqual({ country: 'CN' })
  })

  it('falls back to x-vercel-ip-country when cf-ipcountry absent', async () => {
    vi.mocked(headers).mockResolvedValue({ get: (n) => n === 'x-vercel-ip-country' ? 'US' : null } as MockHeaders)
    const res = await GET()
    expect(await res.json()).toEqual({ country: 'US' })
  })

  it('returns fastly-client-country (Pantheon GCDN current) when no other header present', async () => {
    vi.mocked(headers).mockResolvedValue({ get: (n) => n === 'fastly-client-country' ? 'GB' : null } as MockHeaders)
    const res = await GET()
    expect(await res.json()).toEqual({ country: 'GB' })
  })

  it('returns null when no CDN country header is present', async () => {
    vi.mocked(headers).mockResolvedValue({ get: () => null } as MockHeaders)
    const res = await GET()
    expect(await res.json()).toEqual({ country: null })
  })

  it('prioritizes cf-ipcountry over fastly-client-country', async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (n: string) => {
        if (n === 'cf-ipcountry') return 'DE'
        if (n === 'fastly-client-country') return 'FR'
        return null
      },
    } as MockHeaders)
    const res = await GET()
    expect(await res.json()).toEqual({ country: 'DE' })
  })
})
