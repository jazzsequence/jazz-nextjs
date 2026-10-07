import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: '../tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use multiple workers for parallel test execution.
   * CI targets a deployed Pantheon environment (BASE_URL set → no local webServer), which
   * handles 4 concurrent workers fine. Locally the webServer below is a single `next dev`
   * process, and extra workers saturate it — `page.goto` then times out in whichever spec
   * happens to be unlucky. The dev server, not worker count, is the bottleneck, so fewer
   * workers cost almost nothing in wall time. One worker locally, because the thing that
   * saturates is the dev server's next/image optimizer: with two workers it logged dozens to
   * hundreds of `TimeoutError`s fetching remote CDN images and answered some with a 500,
   * failing a different spec (console-error, image, goto-timeout) on every full run. With one
   * worker the full suite took the same time, logged a handful, and passed. */
  workers: process.env.CI ? 4 : 1,
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
