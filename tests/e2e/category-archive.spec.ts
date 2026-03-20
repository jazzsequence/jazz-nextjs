import { test, expect } from '@playwright/test'

/**
 * Category archive — /category/[slug]
 *
 * Uses "ministry-of-music" — 183 posts, reliable test target.
 */
const testCategory = 'ministry-of-music'

test.describe('Category Archive Page', () => {
  test('should display category heading', async ({ page }) => {
    await page.goto(`/category/${testCategory}`)
    await page.waitForLoadState('domcontentloaded')

    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    await expect(h1).not.toBeEmpty()
  })

  test('should display post list', async ({ page }) => {
    await page.goto(`/category/${testCategory}`)
    await page.waitForLoadState('domcontentloaded')

    const posts = page.locator('article, [data-testid="post-card"]')
    await expect(posts.first()).toBeVisible()
  })

  test('should have navigation', async ({ page }) => {
    await page.goto(`/category/${testCategory}`)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('nav[role="navigation"]')).toBeVisible()
  })

  test('should have footer', async ({ page }) => {
    await page.goto(`/category/${testCategory}`)
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('footer')).toBeVisible()
  })

  test('should return 404 for nonexistent category', async ({ page }) => {
    const response = await page.goto('/category/this-category-does-not-exist-xyz')
    expect(response?.status()).toBe(404)
  })
})
