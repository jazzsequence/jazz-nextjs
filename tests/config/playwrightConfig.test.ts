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

describe('playwright config workers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // Both groups run one worker. The local group is one `next dev` server whose image
  // optimizer timed out under two workers; the Pantheon group is a handful of requests, so
  // parallelism buys it nothing.
  it.each([
    ['in CI', 'true'],
    ['locally', ''],
  ])('uses one worker %s', async (_label, ci) => {
    vi.stubEnv('CI', ci)
    const config = await loadConfig()
    expect(config.workers).toBe(1)
  })
})

// The suite is split in two. Specs under tests/e2e/pantheon/ need a deployed Pantheon
// environment (real cache handler, Linux image optimizer, CDN in front); everything else runs
// against a server the config starts itself and needs no Pantheon environment at all.
describe('playwright config target', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults to the local group: skips the pantheon specs and starts its own server', async () => {
    vi.stubEnv('E2E_TARGET', '')
    vi.stubEnv('BASE_URL', '')
    const config = await loadConfig()
    expect(config.testIgnore).toBe('**/pantheon/**')
    expect(config.testMatch).toBeUndefined()
    expect(config.webServer).toBeDefined()
  })

  it('pantheon target runs only the pantheon specs, with no local server', async () => {
    vi.stubEnv('E2E_TARGET', 'pantheon')
    vi.stubEnv('BASE_URL', 'https://pr-1-jazz-nextjs15.pantheonsite.io')
    const config = await loadConfig()
    expect(config.testMatch).toBe('**/pantheon/**/*.spec.ts')
    expect(config.testIgnore).toBeUndefined()
    expect(config.webServer).toBeUndefined()
    expect(config.use?.baseURL).toBe('https://pr-1-jazz-nextjs15.pantheonsite.io')
  })

  // Without a BASE_URL the pantheon group would silently test localhost and pass or fail
  // for the wrong reason.
  it('pantheon target without BASE_URL fails at load, naming the variable', async () => {
    vi.stubEnv('E2E_TARGET', 'pantheon')
    vi.stubEnv('BASE_URL', '')
    await expect(loadConfig()).rejects.toThrow(/BASE_URL/)
  })

  it('an explicit BASE_URL on the local group tests that server instead of starting one', async () => {
    vi.stubEnv('E2E_TARGET', '')
    vi.stubEnv('BASE_URL', 'http://localhost:3000')
    const config = await loadConfig()
    expect(config.webServer).toBeUndefined()
    expect(config.testIgnore).toBe('**/pantheon/**')
  })
})
