import { defineConfig, devices } from '@playwright/test'

/**
 * The suite is split in two, chosen by E2E_TARGET:
 *   - unset (the default, and what `npm run test:e2e` runs): every spec except the ones under
 *     tests/e2e/pantheon/. Needs no Pantheon environment: it runs against a server this config
 *     starts itself, or against BASE_URL if one is given.
 *   - `pantheon` (`npm run test:e2e:pantheon`): only tests/e2e/pantheon/, which needs something
 *     only a deployed environment has (real cache handler, Linux image optimizer, the CDN in
 *     front). It runs against BASE_URL, which is required, and starts no server.
 */
const pantheon = process.env.E2E_TARGET === 'pantheon'

if (pantheon && !process.env.BASE_URL) {
  // Without it the pantheon specs would quietly test localhost and pass or fail for the wrong
  // reason.
  throw new Error(
    'E2E_TARGET=pantheon needs BASE_URL set to the Pantheon environment to test, for example ' +
      'https://pr-141-jazz-nextjs15.pantheonsite.io',
  )
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: '../tests/e2e',
  testMatch: pantheon ? '**/pantheon/**/*.spec.ts' : undefined,
  testIgnore: pantheon ? undefined : '**/pantheon/**',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* One worker for both groups. The local group runs against a single `next dev` server, and
   * extra workers saturate it — `page.goto` then times out in whichever spec happens to be
   * unlucky. The dev server, not worker count, is the bottleneck, so fewer workers cost almost
   * nothing in wall time. The thing that saturates is its next/image optimizer: with two
   * workers it logged dozens to hundreds of `TimeoutError`s fetching remote CDN images and
   * answered some with a 500, failing a different spec on every full run. With one worker the
   * full suite took the same time, logged a handful, and passed. The pantheon group is a
   * handful of requests, so parallelism buys it nothing. */
  workers: 1,
  /* Global timeout to prevent infinite hangs */
  timeout: 30_000,  // 30 seconds per test
  /* Timeout for expect() assertions */
  expect: {
    timeout: 10_000,  // 10 seconds per assertion
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github'],  // Move github reporter last to prevent blocking
  ] : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
     * Off while a Pantheon bot-bypass token is set: a trace records request headers, so it
     * contains the token, and CI uploads test-results/ and publishes the report to GitHub
     * Pages — this repo and that site are public. Traces return when there is no token. */
    trace: process.env.BOT_BYPASS_TOKEN ? 'off' : 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Explicit headless mode for CI */
    headless: true,
    /* Timeout for individual actions (clicks, fills, etc.) */
    actionTimeout: 10_000,  // 10 seconds
    /* Timeout for page navigations */
    navigationTimeout: 30_000,  // 30 seconds
    /* Browser launch options for CI stability */
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',  // Critical for containerized environments
        '--no-sandbox',  // Often needed in GitHub Actions
      ],
    },
  },

  /* Configure projects for major browsers */
  projects: process.env.TEST_ALL_BROWSERS ? [
    // All browsers: Use TEST_ALL_BROWSERS=1 for comprehensive testing (e.g., nightly tests)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ] : [
    // Default: Only chromium for speed (both local and CI)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests (skip if testing remote) */
  webServer: process.env.BASE_URL ? undefined : {
    // Port 3001 to avoid conflicts with other local services on 3000
    command: 'npm run dev -- -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
    env: {
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || 'test-secret',
    },
  },
})
