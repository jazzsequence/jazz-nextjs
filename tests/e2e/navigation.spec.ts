import { test, expect } from '@playwright/test';

test.describe('Navigation Component', () => {
  test('should display main navigation menu', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('should have menu items', async ({ page }) => {
    await page.goto('/');

    const menuItems = page.locator('nav[role="navigation"] a');
    const count = await menuItems.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should show dropdown menus on hover', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
    }

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find menu items with children (dropdown)
    const menuItemsWithDropdown = page.locator('nav[role="navigation"] li.group');
    const count = await menuItemsWithDropdown.count();

    if (count > 0) {
      const firstDropdownItem = menuItemsWithDropdown.first();

      // Hover over parent menu item
      await firstDropdownItem.hover();

      // Wait a moment for dropdown to appear
      await page.waitForTimeout(200);

      // Dropdown should be visible
      const dropdown = firstDropdownItem.locator('ul');
      await expect(dropdown).toBeVisible();
    } else {
      // No dropdown menus in this menu - test passes
      expect(count).toBe(0);
    }
  });

  test('should hide dropdown menus when not hovering', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
    }

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const menuItemWithDropdown = page.locator('nav[role="navigation"] li.group').first();

    if (await menuItemWithDropdown.count() > 0) {
      // Initially, dropdown should be hidden
      const dropdown = menuItemWithDropdown.locator('ul');
      await expect(dropdown).toBeHidden();
    }
  });

  test('should navigate when clicking menu link', async ({ page }) => {
    await page.goto('/');

    // Find first menu link
    const firstLink = page.locator('nav[role="navigation"] a').first();
    const href = await firstLink.getAttribute('href');

    if (href && !href.startsWith('http')) {
      // Use waitForURL to properly handle Next.js client-side navigation
      await Promise.all([
        page.waitForURL(`**${href}**`),
        firstLink.click(),
      ]);

      // Should navigate to the link
      expect(page.url()).toContain(href);
    }
  });

  test('should show navigation on all pages', async ({ page }) => {
    // Test on homepage
    await page.goto('/');
    let nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Test on posts list
    await page.goto('/posts');
    nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // On mobile, the hamburger toggle should be present
    const hamburger = page.getByRole('button', { name: /open menu/i });
    await expect(hamburger).toBeVisible();

    // The desktop nav is hidden on mobile; clicking the hamburger reveals the mobile panel
    await hamburger.click();

    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeVisible();

    // Mobile menu items should be stacked and take up most of the viewport width
    const menuList = mobileNav.locator('ul').first();
    const box = await menuList.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(300);
    }
  });

  test('should have accessible navigation labels', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav[role="navigation"]');

    // Navigation should have proper ARIA role
    const role = await nav.getAttribute('role');
    expect(role).toBe('navigation');

    // Links should have text content
    const links = nav.locator('a');
    const firstLinkText = await links.first().textContent();
    expect(firstLinkText).toBeTruthy();
    expect(firstLinkText?.trim().length).toBeGreaterThan(0);
  });

  test('header is at the top of the viewport immediately after navigation — no slide-in animation', async ({ page }) => {
    // The framer-motion `layout` prop caused the nav to animate its DOM position
    // on every page mount, making it appear to slide in from off-screen.
    // With `layout` removed, the header must be at y≈0 immediately after load.
    await page.goto('/category/ministry-of-music');
    await page.waitForLoadState('domcontentloaded');

    const header = page.locator('header').first();
    const box = await header.boundingBox();
    // Header top must be at or very near the top of the viewport (within 5px)
    expect(box?.y).toBeLessThanOrEqual(5);
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    await page.goto('/');

    // Get menu items on homepage
    const homeMenuItems = await page.locator('nav[role="navigation"] a').count();

    // Navigate to posts page
    await page.goto('/posts');

    // Should have same menu items
    const postsMenuItems = await page.locator('nav[role="navigation"] a').count();
    expect(postsMenuItems).toBe(homeMenuItems);
  });
});
