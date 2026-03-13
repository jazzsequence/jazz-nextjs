import { test, expect } from '@playwright/test'

test.describe('WordPress Pages', () => {
  // TODO: Fix music page - see GitHub issue
  test.skip('should display music page', async ({ page }) => {
    await page.goto('/music')
    await page.waitForLoadState('domcontentloaded')

    // Check page title
    await expect(page.locator('h1')).toContainText('Music')

    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible()

    // Check footer is present
    await expect(page.locator('footer')).toBeVisible()
  })

  test('should display page content', async ({ page }) => {
    await page.goto('/music')
    await page.waitForLoadState('domcontentloaded')

    // Check article container exists
    const article = page.locator('article')
    await expect(article).toBeVisible()

    // Check content is rendered
    const content = page.locator('[data-testid="post-content"], article')
    await expect(content).toBeVisible()
  })

  test('should have correct metadata', async ({ page }) => {
    await page.goto('/music')
    await page.waitForLoadState('domcontentloaded')

    // Check page title in head
    await expect(page).toHaveTitle(/Music/)
  })

  // TODO: Fix music page navigation - see GitHub issue
  test.skip('should handle page navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Click navigation link to music page
    const musicLink = page.getByRole('link', { name: /music/i }).first()
    if (await musicLink.count() > 0) {
      await musicLink.click()
      await page.waitForURL('**/music', { timeout: 5000 })

      // Verify we're on music page
      await expect(page.locator('h1')).toContainText('Music')
    }
  })

  test('should return 404 for non-existent pages', async ({ page }) => {
    const response = await page.goto('/this-page-definitely-does-not-exist-12345')

    // Should get 404 response
    expect(response?.status()).toBe(404)
  })

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/music')
    await page.waitForLoadState('domcontentloaded')

    // Navigation should be keyboard accessible
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()

    // Should have proper semantic HTML
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('article')).toBeVisible()
  })
})
