import { test, expect } from '@playwright/test'

// Serialize games tests: 4 workers simultaneously hitting /games on a cold Turbopack
// start triggers parallel compilations that collectively exceed the 30s navigation
// timeout. Serial mode ensures the first test compiles the route; the rest reuse it.
test.describe.configure({ mode: 'serial' })

test.describe('Games Page', () => {
  test('should display the games page heading', async ({ page }) => {
    // Extra timeout on first navigation — Turbopack compiles /games on first access
    await page.goto('/games', { timeout: 90000 })
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('h1')).toContainText('Games')
  })

  test('should have correct page title metadata', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveTitle(/Games/)
  })

  test('should render the games grid', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('domcontentloaded')

    const grid = page.getByTestId('games-grid')
    await expect(grid).toBeVisible()
  })

  test('should render game filter controls', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('domcontentloaded')

    const filters = page.getByTestId('game-filters')
    await expect(filters).toBeVisible()

    // Show All button should be present
    await expect(filters.getByRole('button', { name: /show all/i })).toBeVisible()
  })

  test('should render game cards', async ({ page }) => {
    await page.goto('/games')
    // networkidle ensures ISR on-demand generation completes before asserting
    await page.waitForLoadState('networkidle')

    // Grid is always rendered (even empty state); extended timeout for ISR cold-start
    const grid = page.getByTestId('games-grid')
    await expect(grid).toBeVisible({ timeout: 20000 })

    // The count paragraph (inside games-grid) should show games
    const countText = grid.locator('p').filter({ hasText: /\d+ game/ })
    await expect(countText).toBeVisible()
  })

  test('should open modal when a game card is clicked', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('domcontentloaded')

    // Click the first game card (not a filter button)
    const filters = page.getByTestId('game-filters')
    const allButtons = page.locator('button[type="button"]')
    const filterButtons = filters.locator('button[type="button"]')

    // Count filter buttons to skip them
    const filterCount = await filterButtons.count()
    if (filterCount < await allButtons.count()) {
      // Click the first non-filter button (a game card)
      const gameCards = page.getByTestId('games-grid').locator('button[type="button"]').nth(filterCount)
      await gameCards.click()

      // Modal backdrop should appear
      await expect(page.getByTestId('modal-backdrop')).toBeVisible()

      // Modal content should appear
      await expect(page.getByTestId('modal-content')).toBeVisible()
    }
  })

  test('should close modal when backdrop is clicked', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('domcontentloaded')

    const filters = page.getByTestId('game-filters')
    const filterButtons = filters.locator('button[type="button"]')
    const filterCount = await filterButtons.count()
    const allButtons = page.locator('button[type="button"]')

    if (filterCount < await allButtons.count()) {
      const gameCard = page.getByTestId('games-grid').locator('button[type="button"]').nth(filterCount)
      await gameCard.click()

      const backdrop = page.getByTestId('modal-backdrop')
      await expect(backdrop).toBeVisible()

      // Click the backdrop (outside modal content)
      await backdrop.click({ position: { x: 5, y: 5 } })

      await expect(page.getByTestId('modal-backdrop')).not.toBeVisible()
    }
  })

  test('should close modal with close button', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('domcontentloaded')

    const filters = page.getByTestId('game-filters')
    const filterButtons = filters.locator('button[type="button"]')
    const filterCount = await filterButtons.count()
    const allButtons = page.locator('button[type="button"]')

    if (filterCount < await allButtons.count()) {
      const gameCard = page.getByTestId('games-grid').locator('button[type="button"]').nth(filterCount)
      await gameCard.click()

      await expect(page.getByTestId('modal-backdrop')).toBeVisible()

      await page.getByRole('button', { name: /close/i }).click()

      await expect(page.getByTestId('modal-backdrop')).not.toBeVisible()
    }
  })
})
