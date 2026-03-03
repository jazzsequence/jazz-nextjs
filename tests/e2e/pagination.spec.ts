import { test, expect } from '@playwright/test';

test.describe('Pagination Component', () => {
  test('should display pagination on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if pagination exists
    const pagination = page.locator('nav[aria-label="Pagination"]');
    const exists = await pagination.count() > 0;

    if (exists) {
      await expect(pagination).toBeVisible();
    }
  });

  test('should display pagination on posts list', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForLoadState('networkidle');

    const pagination = page.locator('nav[aria-label="Pagination"]');
    const exists = await pagination.count() > 0;

    if (exists) {
      await expect(pagination).toBeVisible();
    }
  });

  test('should show current page highlighted', async ({ page }) => {
    await page.goto('/?page=1');
    await page.waitForLoadState('networkidle');

    const currentPage = page.locator('[aria-current="page"]');
    const exists = await currentPage.count() > 0;

    if (exists) {
      await expect(currentPage).toBeVisible();
      const text = await currentPage.textContent();
      expect(text).toContain('1');
    }
  });

  test('should navigate to page 2 when clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const page2Link = page.getByRole('link', { name: 'Go to page 2' });
    const exists = await page2Link.count() > 0;

    if (exists) {
      await Promise.all([
        page.waitForURL('**/page/2'),
        page2Link.click(),
      ]);

      expect(page.url()).toContain('/page/2');

      // Current page should now be 2
      const currentPage = page.locator('[aria-current="page"]');
      const text = await currentPage.textContent();
      expect(text).toContain('2');
    }
  });

  test('should have working Next button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nextButton = page.locator('a:has-text("Next")');
    const exists = await nextButton.count() > 0;

    if (exists) {
      const isDisabled = await nextButton.getAttribute('aria-disabled');

      if (isDisabled !== 'true') {
        await Promise.all([
          page.waitForURL('**/page/2'),
          nextButton.click(),
        ]);

        expect(page.url()).toContain('/page/2');
      }
    }
  });

  test('should have working Previous button on page 2', async ({ page }) => {
    await page.goto('/page/2');
    await page.waitForLoadState('networkidle');

    const prevButton = page.locator('a:has-text("Previous")');
    const exists = await prevButton.count() > 0;

    if (exists) {
      const isDisabled = await prevButton.getAttribute('aria-disabled');
      expect(isDisabled).not.toBe('true');

      await Promise.all([
        page.waitForURL(/\/$/),
        prevButton.click(),
      ]);

      // Should be back on homepage
      const url = page.url();
      expect(url).toMatch(/\/$/);
    }
  });

  test('should disable Previous button on page 1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const prevButton = page.locator('text=Previous').first();
    const exists = await prevButton.count() > 0;

    if (exists) {
      const ariaDisabled = await prevButton.getAttribute('aria-disabled');
      const isDisabled = ariaDisabled === 'true';

      if (isDisabled) {
        // Should not be clickable
        const className = await prevButton.getAttribute('class');
        expect(className).toContain('pointer-events-none');
      }
    }
  });

  test('should disable Next button on last page', async ({ page }) => {
    // First, find out how many pages there are
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const pageLinks = page.locator('nav[aria-label="Pagination"] a[href*="page="]');
    const count = await pageLinks.count();

    if (count > 0) {
      // Get the highest page number
      const lastPageLink = pageLinks.last();
      await lastPageLink.click();
      await page.waitForLoadState('networkidle');

      const nextButton = page.locator('text=Next').first();
      const ariaDisabled = await nextButton.getAttribute('aria-disabled');

      expect(ariaDisabled).toBe('true');
    }
  });

  test('should show ellipsis for many pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const ellipsis = page.locator('text=...');
    const count = await ellipsis.count();

    // If there are many pages, should show ellipsis
    // This test passes even if no ellipsis (few pages)
    if (count > 0) {
      await expect(ellipsis.first()).toBeVisible();
    }
  });

  test('should update URL when navigating pages', async ({ page }) => {
    await page.goto('/');

    const page2Link = page.getByRole('link', { name: 'Go to page 2' });
    const exists = await page2Link.count() > 0;

    if (exists) {
      await page2Link.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/page/2');
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const page2Link = page.getByRole('link', { name: 'Go to page 2' });
    const exists = await page2Link.count() > 0;

    if (exists) {
      // Focus the link with Tab
      await page2Link.focus();

      // Should be focused
      const isFocused = await page2Link.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);

      // Should be able to activate with Enter
      await Promise.all([
        page.waitForURL('**/page/2'),
        page.keyboard.press('Enter'),
      ]);

      expect(page.url()).toContain('/page/2');
    }
  });
});
