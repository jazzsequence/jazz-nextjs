import { test, expect } from '@playwright/test'

/**
 * Series archive — /series/[slug]
 *
 * Uses "artificial-intelligence" — 21 posts, confirmed real series
 * via WordPress MCP (Organize Series plugin).
 */
const testSeries = 'artificial-intelligence'

test.describe('Series Archive Page', () => {
  test('should display series heading', async ({ page }) => {
    await page.goto(`/series/${testSeries}`)
    await page.waitForLoadState('domcontentloaded')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    await expect(h1).not.toBeEmpty()
  })

  test('should display post list', async ({ page }) => {
    await page.goto(`/series/${testSeries}`)
    await page.waitForLoadState('domcontentloaded')

    const posts = page.locator('article, [data-testid="post-card"]')
    await expect(posts.first()).toBeVisible()
  })

  test('should have navigation', async ({ page }) => {
    await page.goto(`/series/${testSeries}`)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('nav[role="navigation"]')).toBeVisible()
  })

  test('should have footer', async ({ page }) => {
    await page.goto(`/series/${testSeries}`)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('footer')).toBeVisible()
  })

  test('should return 404 for nonexistent series', async ({ page }) => {
    const response = await page.goto('/series/this-series-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
  })
})
