import { test, expect } from '@playwright/test';

test.describe('Posts List Page', () => {
  test('should display posts list heading', async ({ page }) => {
    await page.goto('/posts');

    const heading = page.locator('h1');
    await expect(heading).toContainText('Posts');
  });

  test('should display post cards with images', async ({ page }) => {
    await page.goto('/posts');

    // Wait for posts to load
    await page.waitForLoadState('networkidle');

    // Check for article elements (post cards)
    const articles = page.locator('article');
    const count = await articles.count();

    // Should have at least one post
    expect(count).toBeGreaterThan(0);

    // First post should have an image
    const firstArticle = articles.first();
    const image = firstArticle.locator('img');
    await expect(image).toBeVisible();
  });

  test('should display post metadata', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');

    const firstArticle = page.locator('article').first();

    // Should have title
    const title = firstArticle.locator('h2 a');
    await expect(title).toBeVisible();

    // Should have date
    const date = firstArticle.locator('time');
    await expect(date).toBeVisible();

    // Should have excerpt
    const excerpt = firstArticle.locator('p');
    await expect(excerpt).toBeVisible();
  });

  test('should have clickable post links', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');

    const firstLink = page.locator('article h2 a').first();
    const href = await firstLink.getAttribute('href');

    expect(href).toBeTruthy();
    expect(href).toMatch(/^\/posts\//);
  });

  test('should have pagination controls', async ({ page }) => {
    await page.goto('/posts');

    // Check for pagination component
    const pagination = page.locator('nav[aria-label="Pagination"]');
    await expect(pagination).toBeVisible();
  });

  test('should navigate to page 2', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');

    // Look for page 2 link
    const page2Link = page.locator('a[href="/posts?page=2"]');

    if (await page2Link.isVisible()) {
      await page2Link.click();
      await page.waitForLoadState('networkidle');

      // Should be on page 2
      expect(page.url()).toContain('page=2');
    }
  });

  test('should show proper page count in pagination', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');

    const pagination = page.locator('nav[aria-label="Pagination"]');

    if (await pagination.isVisible()) {
      // Should show current page
      const currentPage = pagination.locator('[aria-current="page"]');
      await expect(currentPage).toBeVisible();
    }
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/posts');

    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await page.goto('/posts');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/posts');

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(heading).toBeVisible();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/posts');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });
});
