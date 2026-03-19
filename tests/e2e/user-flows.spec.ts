import { test, expect } from '@playwright/test';

test.describe('User Navigation Flows', () => {
  test('should navigate from homepage to posts list', async ({ page }) => {
    await page.goto('/');

    // Look for "Posts" link in navigation
    const postsLink = page.locator('nav a:has-text("Posts")');

    if (await postsLink.count() > 0) {
      await postsLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Should be on posts page
      expect(page.url()).toContain('/posts');

      // Should see posts list heading
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
    }
  });

  test('should navigate from homepage to individual post', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click first post title
    const firstPostLink = page.locator('article a[href^="/posts/"]').first();
    const href = await firstPostLink.getAttribute('href');

    expect(href).toBeTruthy();
    expect(href).toMatch(/^\/posts\//);

    await Promise.all([
      page.waitForURL(/\/posts\//),
      firstPostLink.click(),
    ]);

    // Should be on individual post page
    expect(page.url()).toContain('/posts/');

    // Should see post content
    const article = page.locator('article');
    await expect(article).toBeVisible();
  });

  test('should navigate from posts list to individual post and back', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');

    // Click first post
    const firstPostLink = page.locator('article a[href^="/posts/"]').first();
    await Promise.all([
      page.waitForURL(/\/posts\//),
      firstPostLink.click(),
    ]);

    // Should be on post page
    expect(page.url()).toContain('/posts/');

    // Go back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // Should be back on posts list
    expect(page.url()).toContain('/posts');
  });

  test('should maintain navigation across all pages', async ({ page }) => {
    // Start on homepage
    await page.goto('/');
    let nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Navigate to posts
    await page.goto('/posts');
    nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Navigate to an individual post
    const firstPost = page.locator('article a[href^="/posts/"]').first();
    if (await firstPost.count() > 0) {
      await firstPost.click();
      await page.waitForLoadState('domcontentloaded');

      nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();
    }
  });

  test('should maintain footer across all pages', async ({ page }) => {
    // Check homepage
    await page.goto('/');
    let footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check posts list
    await page.goto('/posts');
    footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check individual post
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');

    const firstPost = page.locator('article a[href^="/posts/"]').first();
    if (await firstPost.count() > 0) {
      await firstPost.click();
      await page.waitForLoadState('domcontentloaded');

      footer = page.locator('footer');
      await expect(footer).toBeVisible();
    }
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    // Start on homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const homeUrl = page.url();

    // Navigate to posts
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');
    const postsUrl = page.url();

    // Go back - wait for URL to change
    await page.goBack();
    await page.waitForURL(homeUrl, { timeout: 5000 });
    expect(page.url()).toBe(homeUrl);

    // Go forward - wait for URL to change
    await page.goForward();
    await page.waitForURL(postsUrl, { timeout: 5000 });
    expect(page.url()).toBe(postsUrl);
  });

  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const homeLoadTime = Date.now() - startTime;

    // Homepage should load in reasonable time (< 5 seconds)
    expect(homeLoadTime).toBeLessThan(5000);

    const startTime2 = Date.now();
    await page.goto('/posts');
    await page.waitForLoadState('domcontentloaded');
    const postsLoadTime = Date.now() - startTime2;

    // Posts page should load in reasonable time
    expect(postsLoadTime).toBeLessThan(5000);
  });

  test('should handle pagination across navigation', async ({ page }) => {
    await page.goto('/page/2');
    await page.waitForLoadState('domcontentloaded');

    // Go to posts list
    await page.goto('/posts/page/2');
    await page.waitForLoadState('domcontentloaded');

    // Should maintain page 2
    expect(page.url()).toContain('/page/2');

    // Current page should be highlighted
    const currentPage = page.locator('[aria-current="page"]');
    if (await currentPage.count() > 0) {
      const text = await currentPage.textContent();
      expect(text).toContain('2');
    }
  });

  test('should show build info consistently', async ({ page }) => {
    // Build info is now in the footer as a short commit hash (e.g. "abc1234")
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Footer commit hash: 7-char hex string visible in footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const footerText = await footer.textContent();
    // Should contain a short commit hash (7 hex chars) or "unknown"
    const hasCommit = /[0-9a-f]{7}|unknown/.test(footerText ?? '');
    expect(hasCommit).toBe(true);
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Navigate directly to page 2
    await page.goto('/page/2');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/page/2');

    // Should show page 2 content
    const articles = page.locator('article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });
});
