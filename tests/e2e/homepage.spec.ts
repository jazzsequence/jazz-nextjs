import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display Jazz Next.js heading', async ({ page }) => {
    await page.goto('/')

    // Check for main heading
    const heading = page.locator('h1')
    await expect(heading).toContainText('Jazz Next.js')
  })

  test('should show deployment successful message', async ({ page }) => {
    await page.goto('/')

    // Check for deployment status
    const status = page.locator('text=Deployment Successful')
    await expect(status).toBeVisible()
  })

  test('should display build timestamp', async ({ page }) => {
    await page.goto('/')

    // Check for build timestamp (ISO format date)
    const buildText = page.locator('text=/Build:/')
    await expect(buildText).toBeVisible()

    // Verify it contains a valid ISO date format
    const text = await buildText.textContent()
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('should display tech stack versions', async ({ page }) => {
    await page.goto('/')

    // Check for Next.js version
    await expect(page.locator('text=/Next.js 16/')).toBeVisible()

    // Check for React version
    await expect(page.locator('text=/React 19/')).toBeVisible()

    // Check for Node version
    await expect(page.locator('text=/Node 24/')).toBeVisible()
  })

  test('should have gradient background', async ({ page }) => {
    await page.goto('/')

    // Check for gradient background on main container
    const container = page.locator('div.bg-gradient-to-br')
    await expect(container).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const heading = page.locator('h1')
    await expect(heading).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(heading).toBeVisible()
  })

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')

    // Allow page to fully load
    await page.waitForLoadState('networkidle')

    // Should have no console errors
    expect(consoleErrors).toHaveLength(0)
  })

  test('should load all static assets successfully', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`)
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should have no failed requests
    expect(failedRequests).toHaveLength(0)
  })
})
