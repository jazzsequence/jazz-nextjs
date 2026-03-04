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
  /* Use multiple workers for parallel test execution */
  workers: process.env.CI ? 1 : 4,  // Single worker in CI for stability, 4 locally for speed
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
    baseURL: process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
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

  /* Load test environment variables */
  ...(process.env.NODE_ENV !== 'production' && {
    env: {
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || 'test-secret',
      WORDPRESS_USERNAME: process.env.WORDPRESS_USERNAME,
      WORDPRESS_APP_PASSWORD: process.env.WORDPRESS_APP_PASSWORD,
    },
  }),

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
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      REVALIDATE_SECRET: process.env.REVALIDATE_SECRET || 'test-secret',
    },
  },
})
