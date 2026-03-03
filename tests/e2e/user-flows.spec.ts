import { test, expect } from '@playwright/test';

test.describe('User Navigation Flows', () => {
  test('should navigate from homepage to posts list', async ({ page }) => {
    await page.goto('/');

    // Look for "Posts" link in navigation
    const postsLink = page.locator('nav a:has-text("Posts")');

    if (await postsLink.count() > 0) {
      await postsLink.click();
      await page.waitForLoadState('networkidle');

      // Should be on posts page
      expect(page.url()).toContain('/posts');

      // Should see posts list heading
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
    }
  });

  test('should navigate from homepage to individual post', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click first post title
    const firstPostLink = page.locator('article h2 a').first();
    const href = await firstPostLink.getAttribute('href');

    expect(href).toBeTruthy();
    expect(href).toMatch(/^\/posts\//);

    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    // Should be on individual post page
    expect(page.url()).toContain('/posts/');

    // Should see post content
    const article = page.locator('article');
    await expect(article).toBeVisible();
  });

  test('should navigate from posts list to individual post and back', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');

    // Click first post
    const firstPostLink = page.locator('article h2 a').first();
    await firstPostLink.click();
    await page.waitForLoadState('networkidle');

    // Should be on post page
    expect(page.url()).toContain('/posts/');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

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
    const firstPost = page.locator('article h2 a').first();
    if (await firstPost.count() > 0) {
      await firstPost.click();
      await page.waitForLoadState('networkidle');

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
    await page.waitForLoadState('networkidle');

    const firstPost = page.locator('article h2 a').first();
    if (await firstPost.count() > 0) {
      await firstPost.click();
      await page.waitForLoadState('networkidle');

      footer = page.locator('footer');
      await expect(footer).toBeVisible();
    }
  });

  test('should handle browser back and forward navigation', async ({ page }) => {
    // Start on homepage
    await page.goto('/');
    const homeUrl = page.url();

    // Navigate to posts
    await page.goto('/posts');
    const postsUrl = page.url();

    // Go back
    await page.goBack();
    expect(page.url()).toBe(homeUrl);

    // Go forward
    await page.goForward();
    expect(page.url()).toBe(postsUrl);
  });

  test('should load pages quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const homeLoadTime = Date.now() - startTime;

    // Homepage should load in reasonable time (< 5 seconds)
    expect(homeLoadTime).toBeLessThan(5000);

    const startTime2 = Date.now();
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');
    const postsLoadTime = Date.now() - startTime2;

    // Posts page should load in reasonable time
    expect(postsLoadTime).toBeLessThan(5000);
  });

  test('should handle pagination across navigation', async ({ page }) => {
    await page.goto('/page/2');
    await page.waitForLoadState('networkidle');

    // Go to posts list
    await page.goto('/posts/page/2');
    await page.waitForLoadState('networkidle');

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
    // Check on homepage
    await page.goto('/');
    const homeBuildInfo = page.locator('text=/Commit:/');
    await expect(homeBuildInfo).toBeVisible();

    const homeText = await homeBuildInfo.textContent();
    const homeCommit = homeText?.match(/Commit:\s*(\S+)/)?.[1];

    // Check on posts page - should show same commit hash
    await page.goto('/posts');
    const postsBuildInfo = page.locator('text=/Commit:/');

    if (await postsBuildInfo.count() > 0) {
      const postsText = await postsBuildInfo.textContent();
      const postsCommit = postsText?.match(/Commit:\s*(\S+)/)?.[1];
      expect(postsCommit).toBe(homeCommit);
    }
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Navigate directly to page 2
    await page.goto('/page/2');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/page/2');

    // Should show page 2 content
    const articles = page.locator('article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });
});
