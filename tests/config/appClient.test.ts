// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { BOT_BYPASS_HEADER } from '../e2e/support/bot-bypass'
import { createAppClient } from '../e2e/support/app-client'

const BASE = 'https://dev-jazz-nextjs15.pantheonsite.io'
const TOKEN = 'app-client-test-token'

function okFetch(body = '{"ok":true}', init: ResponseInit = { status: 200 }) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(body, { headers: { 'content-type': 'application/json' }, ...init }),
  )
}

const sentHeaders = (fetchMock: ReturnType<typeof okFetch>) =>
  new Headers(fetchMock.mock.calls[0][1]?.headers as HeadersInit)

// Why this client exists instead of Playwright's request fixture: Playwright records every
// request header in the call log of a failed APIRequestContext call AND in the report step for
// it, and the HTML report that CI publishes to public GitHub Pages embeds that step. Wrapping the
// thrown error does not reach the step (measured). Node's fetch has no such log.
describe('createAppClient', () => {
  it('resolves relative paths against the base URL', async () => {
    const fetchMock = okFetch()
    await createAppClient(BASE, TOKEN, fetchMock).get('/api/revalidate')
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${BASE}/api/revalidate`)
  })

  it('sends the bypass token to the app origin', async () => {
    const fetchMock = okFetch()
    await createAppClient(BASE, TOKEN, fetchMock).get('/')
    expect(sentHeaders(fetchMock).get(BOT_BYPASS_HEADER)).toBe(TOKEN)
  })

  it('does not send the token to another origin', async () => {
    const fetchMock = okFetch()
    await createAppClient(BASE, TOKEN, fetchMock).get('https://sfo2.digitaloceanspaces.com/a.png')
    expect(sentHeaders(fetchMock).has(BOT_BYPASS_HEADER)).toBe(false)
  })

  it('sends no token header when there is no token', async () => {
    const fetchMock = okFetch()
    await createAppClient(BASE, undefined, fetchMock).get('/')
    expect(sentHeaders(fetchMock).has(BOT_BYPASS_HEADER)).toBe(false)
  })

  it('posts JSON and merges caller headers', async () => {
    const fetchMock = okFetch()
    await createAppClient(BASE, TOKEN, fetchMock).post('/api/revalidate', {
      data: { path: '/' },
      headers: { 'x-revalidate-secret': 's3cret' },
    })
    const init = fetchMock.mock.calls[0][1]!
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"path":"/"}')
    const headers = sentHeaders(fetchMock)
    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('x-revalidate-secret')).toBe('s3cret')
    expect(headers.get(BOT_BYPASS_HEADER)).toBe(TOKEN)
  })

  it('applies a timeout signal', async () => {
    const fetchMock = okFetch()
    await createAppClient(BASE, TOKEN, fetchMock).get('/', { timeout: 5000 })
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('exposes the response the way the specs read it', async () => {
    const response = await createAppClient(BASE, TOKEN, okFetch('{"error":"Invalid secret"}', { status: 401 })).post('/x')
    expect(response.status()).toBe(401)
    expect(response.ok()).toBe(false)
    expect(response.headers()['content-type']).toBe('application/json')
    expect(await response.json()).toEqual({ error: 'Invalid secret' })
  })

  it('exposes the body as text', async () => {
    const response = await createAppClient(BASE, TOKEN, okFetch('<html></html>')).get('/')
    expect(await response.text()).toBe('<html></html>')
  })

  it('lets network errors propagate unchanged', async () => {
    const failure = new TypeError('fetch failed')
    const fetchMock = vi.fn(async () => {
      throw failure
    })
    await expect(createAppClient(BASE, TOKEN, fetchMock).get('/')).rejects.toBe(failure)
  })

  // The property the whole design rests on, against the real global fetch: a failed request
  // does not echo request headers anywhere in the error or its cause chain.
  it('does not put the token in a real network error', async () => {
    const client = createAppClient('https://127.0.0.1:59998', TOKEN) // closed port, https
    const error = (await client.get('/').catch((e: unknown) => e)) as Error
    expect(error).toBeInstanceOf(Error)
    const chain: string[] = []
    for (let e: unknown = error; e instanceof Error; e = e.cause) chain.push(`${e.message}\n${e.stack ?? ''}`)
    expect(chain.join('\n')).not.toContain(TOKEN)
  })
})
