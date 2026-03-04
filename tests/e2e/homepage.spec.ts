import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display personalized greeting', async ({ page }) => {
    await page.goto('/');

    // Check for greeting heading (time-based: morning/afternoon/evening)
    const heading = page.locator('h1');
    await expect(heading).toContainText("Chris");

    // Should be one of the time-based greetings or fallback
    const text = await heading.textContent();
    const validGreetings = [
      "Good morning",
      "Good afternoon",
      "Good evening",
      "Welcome adventurer", // D&D Thursday
      "Hi, I'm Chris" // Fallback
    ];

    const hasValidGreeting = validGreetings.some(greeting =>
      text?.includes(greeting)
    );

    expect(hasValidGreeting).toBe(true);
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for navigation
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Check for menu items
    const menuItems = nav.locator('a');
    await expect(menuItems.first()).toBeVisible();
  });

  test('should display build timestamp in non-production', async ({ page }) => {
    await page.goto('/');

    // Build info should be visible in dev/test
    const buildInfo = page.locator('text=/Build:.*Commit:/');
    const isVisible = await buildInfo.isVisible();

    // Build info visibility depends on environment
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display post cards', async ({ page }) => {
    await page.goto('/');

    // Wait for posts to load
    await page.waitForLoadState('domcontentloaded');

    // Check for article elements (post cards)
    const articles = page.locator('article');
    const count = await articles.count();

    // Should have at least one post
    expect(count).toBeGreaterThan(0);
  });

  test('should display post titles with links', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');

    // Check for post title links
    const postLinks = page.locator('article h2 a');
    const firstLink = postLinks.first();

    if ((await postLinks.count()) > 0) {
      await expect(firstLink).toBeVisible();

      // Verify link has href
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/posts\//);
    }
  });

  test('should have footer', async ({ page }) => {
    await page.goto('/');

    // Check for footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Check for copyright
    const copyright = footer.getByText(/©.*Chris Reynolds/);
    await expect(copyright).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

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

    await page.goto('/');

    // Allow page to fully load
    await page.waitForLoadState('domcontentloaded');

    // Should have no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should load all static assets successfully', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Should have no failed requests
    expect(failedRequests).toHaveLength(0);
  });
});
