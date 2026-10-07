import { describe, it, expect } from 'vitest'
import { BOT_BYPASS_HEADER, botBypassHeaders } from '../e2e/support/bot-bypass'

const BASE = 'https://dev-jazz-nextjs15.pantheonsite.io'
const TOKEN = 'test-token-value'

describe('botBypassHeaders', () => {
  it('uses the header name Pantheon documents', () => {
    expect(BOT_BYPASS_HEADER).toBe('x-pantheon-bot-bypass')
  })

  it('attaches the token to requests for the app origin', () => {
    expect(botBypassHeaders(`${BASE}/posts/x`, BASE, TOKEN)).toEqual({ [BOT_BYPASS_HEADER]: TOKEN })
  })

  it('attaches the token when the request path is relative-resolved to the app origin', () => {
    expect(botBypassHeaders(`${BASE}/_next/image?url=%2Fa.png`, BASE, TOKEN)).toEqual({
      [BOT_BYPASS_HEADER]: TOKEN,
    })
  })

  // The token is a credential. Playwright's extraHTTPHeaders would send it to every host the
  // page touches (YouTube, Spotify, jsdelivr, the image CDN), so scoping is the whole point.
  it.each([
    ['the image CDN', 'https://sfo2.digitaloceanspaces.com/cdn.jazzsequence/a.png'],
    ['a third-party embed', 'https://www.youtube.com/embed/abc'],
    ['another Pantheon site', 'https://live-jazz-nextjs15.pantheonsite.io/'],
    ['a lookalike host that merely starts with the app origin', `${BASE}.evil.example/`],
    ['the same host on another port', 'https://dev-jazz-nextjs15.pantheonsite.io:8443/'],
  ])('does not attach the token for %s', (_label, url) => {
    expect(botBypassHeaders(url, BASE, TOKEN)).toEqual({})
  })

  it.each([
    ['undefined', undefined],
    ['empty', ''],
  ])('sends nothing when the token is %s', (_label, token) => {
    expect(botBypassHeaders(`${BASE}/`, BASE, token)).toEqual({})
  })

  it('sends nothing when there is no base URL', () => {
    expect(botBypassHeaders(`${BASE}/`, undefined, TOKEN)).toEqual({})
  })

  it('never sends the token over plain http', () => {
    const http = 'http://localhost:3001'
    expect(botBypassHeaders(`${http}/`, http, TOKEN)).toEqual({})
  })

  it('does not throw on an unparseable URL', () => {
    expect(botBypassHeaders('not a url', BASE, TOKEN)).toEqual({})
    expect(botBypassHeaders(`${BASE}/`, 'also not a url', TOKEN)).toEqual({})
  })
})
