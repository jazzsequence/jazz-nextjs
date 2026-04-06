# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Navigation Component >> should maintain navigation state across pages
- Location: tests/e2e/navigation.spec.ts:149:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 23
Received: 0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - img [ref=e4]
  - heading "This page couldn’t load" [level=1] [ref=e6]
  - paragraph [ref=e7]: Reload to try again, or go back.
  - generic [ref=e8]:
    - button "Reload" [ref=e10] [cursor=pointer]
    - button "Back" [ref=e11] [cursor=pointer]
```

# Test source

```ts
  60  |     if (await menuItemWithDropdown.count() > 0) {
  61  |       // Initially, dropdown should be hidden
  62  |       const dropdown = menuItemWithDropdown.locator('ul');
  63  |       await expect(dropdown).toBeHidden();
  64  |     }
  65  |   });
  66  | 
  67  |   test('should navigate when clicking menu link', async ({ page }) => {
  68  |     await page.goto('/');
  69  | 
  70  |     // Find first menu link
  71  |     const firstLink = page.locator('nav[role="navigation"] a').first();
  72  |     const href = await firstLink.getAttribute('href');
  73  | 
  74  |     if (href && !href.startsWith('http')) {
  75  |       // Use waitForURL to properly handle Next.js client-side navigation
  76  |       await Promise.all([
  77  |         page.waitForURL(`**${href}**`),
  78  |         firstLink.click(),
  79  |       ]);
  80  | 
  81  |       // Should navigate to the link
  82  |       expect(page.url()).toContain(href);
  83  |     }
  84  |   });
  85  | 
  86  |   test('should show navigation on all pages', async ({ page }) => {
  87  |     // Test on homepage
  88  |     await page.goto('/');
  89  |     let nav = page.locator('nav[role="navigation"]');
  90  |     await expect(nav).toBeVisible();
  91  | 
  92  |     // Test on posts list
  93  |     await page.goto('/posts');
  94  |     nav = page.locator('nav[role="navigation"]');
  95  |     await expect(nav).toBeVisible();
  96  |   });
  97  | 
  98  |   test('should be responsive on mobile', async ({ page }) => {
  99  |     await page.setViewportSize({ width: 375, height: 667 });
  100 |     await page.goto('/');
  101 | 
  102 |     // On mobile, the hamburger toggle should be present
  103 |     const hamburger = page.getByRole('button', { name: /open menu/i });
  104 |     await expect(hamburger).toBeVisible();
  105 | 
  106 |     // The desktop nav is hidden on mobile; clicking the hamburger reveals the mobile panel
  107 |     await hamburger.click();
  108 | 
  109 |     const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
  110 |     await expect(mobileNav).toBeVisible();
  111 | 
  112 |     // Mobile menu items should be stacked and take up most of the viewport width
  113 |     const menuList = mobileNav.locator('ul').first();
  114 |     const box = await menuList.boundingBox();
  115 |     if (box) {
  116 |       expect(box.width).toBeGreaterThan(300);
  117 |     }
  118 |   });
  119 | 
  120 |   test('should have accessible navigation labels', async ({ page }) => {
  121 |     await page.goto('/');
  122 | 
  123 |     const nav = page.locator('nav[role="navigation"]');
  124 | 
  125 |     // Navigation should have proper ARIA role
  126 |     const role = await nav.getAttribute('role');
  127 |     expect(role).toBe('navigation');
  128 | 
  129 |     // Links should have text content
  130 |     const links = nav.locator('a');
  131 |     const firstLinkText = await links.first().textContent();
  132 |     expect(firstLinkText).toBeTruthy();
  133 |     expect(firstLinkText?.trim().length).toBeGreaterThan(0);
  134 |   });
  135 | 
  136 |   test('header is at the top of the viewport immediately after navigation — no slide-in animation', async ({ page }) => {
  137 |     // The framer-motion `layout` prop caused the nav to animate its DOM position
  138 |     // on every page mount, making it appear to slide in from off-screen.
  139 |     // With `layout` removed, the header must be at y≈0 immediately after load.
  140 |     await page.goto('/category/ministry-of-music');
  141 |     await page.waitForLoadState('domcontentloaded');
  142 | 
  143 |     const header = page.locator('header').first();
  144 |     const box = await header.boundingBox();
  145 |     // Header top must be at or very near the top of the viewport (within 5px)
  146 |     expect(box?.y).toBeLessThanOrEqual(5);
  147 |   });
  148 | 
  149 |   test('should maintain navigation state across pages', async ({ page }) => {
  150 |     await page.goto('/');
  151 | 
  152 |     // Get menu items on homepage
  153 |     const homeMenuItems = await page.locator('nav[role="navigation"] a').count();
  154 | 
  155 |     // Navigate to posts page
  156 |     await page.goto('/posts');
  157 | 
  158 |     // Should have same menu items
  159 |     const postsMenuItems = await page.locator('nav[role="navigation"] a').count();
> 160 |     expect(postsMenuItems).toBe(homeMenuItems);
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  161 |   });
  162 | });
  163 | 
```