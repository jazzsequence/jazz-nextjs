import { test, expect } from '@playwright/test';

test.describe('Individual Post Page', () => {
  let testSlug: string;

  // Get a real post slug before running tests
  test.beforeAll(async ({ request }) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const response = await request.get(`${baseUrl}/`);
    const html = await response.text();

    // Extract first post slug from homepage
    const match = html.match(/href="\/posts\/([^"]+)"/);
    if (match && match[1]) {
      testSlug = match[1];
    } else {
      // Fallback to a commonly available post
      testSlug = 'welcome';
    }
  });

  test('should display post title', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    const titleText = await heading.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText?.length).toBeGreaterThan(0);
  });

  test('should display post content', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);

    // Content should be in article element — use first() since embedded article
    // cards (ArticleCard) also render <article> tags inside the post body.
    const article = page.locator('article').first();
    await expect(article).toBeVisible();

    // Should have some text content
    const content = await article.textContent();
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(50); // Reasonable content length
  });

  test('should display post date', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);

    const date = page.locator('time');
    await expect(date).toBeVisible();
  });

  test('should display featured image if available', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);
    await page.waitForLoadState('domcontentloaded');

    // Featured image is optional, so check if it exists
    const image = page.locator('article img').first();
    const imageExists = await image.count() > 0;

    if (imageExists) {
      await expect(image).toBeVisible();
    }
  });

  test('should safely render HTML content', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);

    // Content should be rendered (not showing raw HTML)
    const article = page.locator('article').first();

    // Should not contain escaped HTML entities in normal text
    const visibleText = await article.textContent();
    expect(visibleText).not.toContain('&lt;');
    expect(visibleText).not.toContain('&gt;');
  });

  test('should handle 404 for non-existent posts', async ({ page }) => {
    const response = await page.goto('/posts/this-post-definitely-does-not-exist-12345');

    // Should return 404 or show not found page
    if (response) {
      const status = response.status();
      // Accept 404 or 200 with "not found" content
      expect([200, 404]).toContain(status);
    }

    // Should show some indication of not found
    const body = page.locator('body');
    const text = await body.textContent();

    // Check for 404 or not found indicators
    const hasNotFoundIndicator =
      text?.toLowerCase().includes('not found') ||
      text?.toLowerCase().includes('404') ||
      text?.toLowerCase().includes('does not exist');

    expect(hasNotFoundIndicator).toBe(true);
  });

  test('should have navigation back to posts', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);

    // Should have navigation menu with link to posts
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/posts/${testSlug}`);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(heading).toBeVisible();
  });

  test('should have readable content width', async ({ page }) => {
    await page.goto(`/posts/${testSlug}`);

    const article = page.locator('article').first();
    const box = await article.boundingBox();

    // Content should not be too wide (for readability)
    // Max ~800px is common for readable content
    if (box) {
      expect(box.width).toBeLessThan(1200);
    }
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(`/posts/${testSlug}`);
    await page.waitForLoadState('domcontentloaded');

    expect(consoleErrors).toHaveLength(0);
  });

  test('should load all assets successfully', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    await page.goto(`/posts/${testSlug}`);
    await page.waitForLoadState('domcontentloaded');

    expect(failedRequests).toHaveLength(0);
  });
});
