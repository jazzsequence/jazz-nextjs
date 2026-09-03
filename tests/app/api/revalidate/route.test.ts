import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { POST } from '@/app/api/revalidate/route'
import { revalidatePath } from 'next/cache'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

const ORIGINAL_SECRET = process.env.REVALIDATE_SECRET

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.REVALIDATE_SECRET
  } else {
    process.env.REVALIDATE_SECRET = ORIGINAL_SECRET
  }
})

describe('POST /api/revalidate — authentication', () => {
  describe('when the server secret is configured', () => {
    beforeEach(() => {
      process.env.REVALIDATE_SECRET = 'server-secret'
    })

    it('rejects a request with no secret at all', async () => {
      const res = await POST(makeRequest({ path: '/' }) as never)
      expect(res.status).toBe(401)
    })

    it('rejects a request with the wrong header secret', async () => {
      const res = await POST(
        makeRequest({ path: '/' }, { 'x-revalidate-secret': 'wrong' }) as never
      )
      expect(res.status).toBe(401)
    })

    it('rejects a request with the wrong body secret', async () => {
      const res = await POST(makeRequest({ path: '/', secret: 'wrong' }) as never)
      expect(res.status).toBe(401)
    })

    it('accepts a correct header secret and revalidates', async () => {
      const res = await POST(
        makeRequest({ path: '/' }, { 'x-revalidate-secret': 'server-secret' }) as never
      )
      expect(res.status).toBe(200)
      expect(revalidatePath).toHaveBeenCalledWith('/')
    })

    it('accepts a correct body secret and revalidates (mu-plugin compatibility)', async () => {
      const res = await POST(makeRequest({ path: '/', secret: 'server-secret' }) as never)
      expect(res.status).toBe(200)
      expect(revalidatePath).toHaveBeenCalledWith('/')
    })
  })

  // The endpoint purges ISR cache. If an unconfigured environment left it open,
  // anyone could force repeated cold regeneration against WordPress.
  describe('when the server secret is NOT configured', () => {
    it('rejects an unauthenticated request instead of failing open', async () => {
      delete process.env.REVALIDATE_SECRET

      // Sends no header and no body secret, so the caller-side value is also
      // undefined. A bare !== comparison treats undefined === undefined as a
      // match and lets the request through.
      const res = await POST(makeRequest({ path: '/' }) as never)

      expect(res.status).toBe(401)
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('rejects a request that supplies an empty-string secret', async () => {
      // A missing GitHub secret or Pantheon env var renders as '' rather than
      // being absent, so the empty case must be rejected too.
      process.env.REVALIDATE_SECRET = ''

      const res = await POST(
        makeRequest({ path: '/' }, { 'x-revalidate-secret': '' }) as never
      )

      expect(res.status).toBe(401)
    })

    it('rejects even when the caller guesses a value', async () => {
      delete process.env.REVALIDATE_SECRET

      const res = await POST(
        makeRequest({ path: '/' }, { 'x-revalidate-secret': 'anything' }) as never
      )

      expect(res.status).toBe(401)
    })
  })
})
