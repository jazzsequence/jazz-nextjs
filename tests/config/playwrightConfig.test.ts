import { describe, it, expect, vi, afterEach } from 'vitest'

// config/playwright.config.ts reads process.env when it is imported, so each case sets the
// environment first and re-imports a fresh copy.
async function loadConfig() {
  vi.resetModules()
  return (await import('../../config/playwright.config')).default
}

describe('playwright config traces', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // A Playwright trace records the request headers it saw — measured: with a dummy token set,
  // the token and the x-pantheon-bot-bypass header name were both in the trace's network log.
  // CI retries failing tests, uploads test-results/ as an artifact and publishes the report to
  // GitHub Pages, and this repo and its Pages site are public, so a retried test would publish
  // the credential.
  it('records no traces while a bot-bypass token is set', async () => {
    vi.stubEnv('BOT_BYPASS_TOKEN', 'test-token-value')
    const config = await loadConfig()
    expect(config.use?.trace).toBe('off')
  })

  it('keeps retry traces when there is no token', async () => {
    vi.stubEnv('BOT_BYPASS_TOKEN', '')
    const config = await loadConfig()
    expect(config.use?.trace).toBe('on-first-retry')
  })
})
