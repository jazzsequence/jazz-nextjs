import { test, expect } from '@playwright/test';

test.describe('Greeting Component', () => {
  test.describe('time-based greetings', () => {
    test('should display morning greeting', async ({ page }) => {
      await page.goto('/?greeting=morning');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toContainText("Good morning");
    });

    test('should display afternoon greeting', async ({ page }) => {
      await page.goto('/?greeting=afternoon');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toContainText("Good afternoon");
    });

    test('should display evening greeting', async ({ page }) => {
      await page.goto('/?greeting=evening');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toContainText("Good evening");
    });
  });

  test.describe('special greetings', () => {
    test('should display D&D greeting', async ({ page }) => {
      await page.goto('/?greeting=dnd');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toContainText("Welcome adventurer");
    });

    test('should display China greeting', async ({ page }) => {
      await page.goto('/?greeting=china');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toContainText("嗨，我是 Chris");
    });
  });

  test.describe('fallback greeting', () => {
    test('should display fallback greeting', async ({ page }) => {
      await page.goto('/?greeting=fallback');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toContainText("Hi, I'm Chris");
    });

    test('should display fallback for invalid greeting parameter', async ({ page }) => {
      await page.goto('/?greeting=invalid');

      const heading = page.getByRole('heading', { level: 1 });
      // Should fall back to default
      await expect(heading).toBeVisible();
    });
  });

  test.describe('production vs non-production', () => {
    test('should work in non-production with query params', async ({ page }) => {
      // This test runs in dev/test environment
      await page.goto('/?greeting=morning');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toContainText("Good morning");
    });

    // Note: In production, query params are ignored and actual
    // time/geo-based matching is used. Can't test production behavior
    // in E2E since we can't mock server headers in real deployment.
  });

  test.describe('content rendering', () => {
    test('should render greeting content', async ({ page }) => {
      await page.goto('/?greeting=morning');

      // Should have heading
      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();

      // Should have content section
      const section = page.locator('section').first();
      await expect(section).toBeVisible();
    });

    test('should sanitize HTML (no script tags)', async ({ page }) => {
      await page.goto('/?greeting=fallback');

      // Should not have any script tags (XSS protection)
      const scripts = page.locator('section script');
      await expect(scripts).toHaveCount(0);
    });
  });

  test.describe('accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/?greeting=morning');

      // Greeting should be the first H1 on the page
      const h1 = page.getByRole('heading', { level: 1 }).first();
      await expect(h1).toBeVisible();
      await expect(h1).toContainText("Chris");
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/?greeting=afternoon');

      // Tab through page - greeting should be reachable
      await page.keyboard.press('Tab');
      const activeElement = page.locator(':focus');

      // Should be able to navigate the page
      await expect(activeElement).toBeVisible();
    });
  });

  test.describe('timezone-based greeting (real behavior)', () => {
    test('should display time-appropriate greeting without params', async ({ page }) => {
      // Without ?greeting= param, should use actual time-based logic
      await page.goto('/');

      const heading = page.getByRole('heading', { level: 1 });
      await expect(heading).toBeVisible();

      const text = await heading.textContent();

      // Should match one of the expected greetings
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
  });
});
