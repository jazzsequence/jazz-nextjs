# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pagination.spec.ts >> Pagination Component >> does not overflow horizontally on /media at 320px (mobile regression)
- Location: tests/e2e/pagination.spec.ts:216:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav[aria-label="Pagination"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('nav[aria-label="Pagination"]') with timeout 10000ms
  - waiting for locator('nav[aria-label="Pagination"]')

```

```yaml
- main:
  - img "Icon for pr-138-jazz-nextjs15.pantheonsite.io"
  - heading "pr-138-jazz-nextjs15.pantheonsite.io" [level=1]
  - heading "Performing security verification" [level=2]
  - paragraph: This website uses a security service to protect against malicious bots. This page is displayed while the website verifies you are not a bot.
- contentinfo:
  - text: "Ray ID:"
  - code: a45c2c85cf75e6b9
  - text: Performance and Security by
  - link "Cloudflare, opens in a new tab":
    - /url: https://www.cloudflare.com?utm_source=challenge&utm_campaign=m
    - text: Cloudflare
  - link "Privacy, opens in a new tab":
    - /url: https://www.cloudflare.com/privacypolicy/
    - text: Privacy
```

# Test source

```ts
  123 |         expect(className).toContain('pointer-events-none');
  124 |       }
  125 |     }
  126 |   });
  127 | 
  128 |   test('should disable Next button on last page', async ({ page }) => {
  129 |     // First, find out how many pages there are
  130 |     await page.goto('/');
  131 |     await page.waitForLoadState('domcontentloaded');
  132 | 
  133 |     const pageLinks = page.locator('nav[aria-label="Pagination"] a[href*="page="]');
  134 |     const count = await pageLinks.count();
  135 | 
  136 |     if (count > 0) {
  137 |       // Get the highest page number
  138 |       const lastPageLink = pageLinks.last();
  139 |       await lastPageLink.click();
  140 |       await page.waitForLoadState('domcontentloaded');
  141 | 
  142 |       const nextButton = page.locator('text=Next').first();
  143 |       const ariaDisabled = await nextButton.getAttribute('aria-disabled');
  144 | 
  145 |       expect(ariaDisabled).toBe('true');
  146 |     }
  147 |   });
  148 | 
  149 |   test('should show ellipsis for many pages', async ({ page }) => {
  150 |     await page.goto('/');
  151 |     await page.waitForLoadState('domcontentloaded');
  152 | 
  153 |     const ellipsis = page.locator('text=...');
  154 |     const count = await ellipsis.count();
  155 | 
  156 |     // If there are many pages, should show ellipsis
  157 |     // This test passes even if no ellipsis (few pages)
  158 |     if (count > 0) {
  159 |       await expect(ellipsis.first()).toBeVisible();
  160 |     }
  161 |   });
  162 | 
  163 |   test('should update URL when navigating pages', async ({ page }) => {
  164 |     await page.goto('/');
  165 | 
  166 |     const page2Link = page.getByRole('link', { name: 'Go to page 2' });
  167 |     const exists = await page2Link.count() > 0;
  168 | 
  169 |     if (exists) {
  170 |       await page2Link.click();
  171 |       // Wait for URL to change (Next.js client-side navigation)
  172 |       await page.waitForURL('**/page/2', { timeout: 5000 });
  173 | 
  174 |       expect(page.url()).toContain('/page/2');
  175 |     }
  176 |   });
  177 | 
  178 |   test('should be keyboard navigable', async ({ page }) => {
  179 |     await page.goto('/');
  180 |     await page.waitForLoadState('domcontentloaded');
  181 | 
  182 |     const page2Link = page.getByRole('link', { name: 'Go to page 2' });
  183 |     const exists = await page2Link.count() > 0;
  184 | 
  185 |     if (exists) {
  186 |       // Focus the link with Tab
  187 |       await page2Link.focus();
  188 | 
  189 |       // Should be focused
  190 |       const isFocused = await page2Link.evaluate(el => el === document.activeElement);
  191 |       expect(isFocused).toBe(true);
  192 | 
  193 |       // Should be able to activate with Enter
  194 |       await Promise.all([
  195 |         page.waitForURL('**/page/2'),
  196 |         page.keyboard.press('Enter'),
  197 |       ]);
  198 | 
  199 |       expect(page.url()).toContain('/page/2');
  200 |     }
  201 |   });
  202 | 
  203 |   // Regression (/media horizontal scrollbar on mobile). Two distinct defects,
  204 |   // each guarded below at 320px (iPhone SE / small Android) and 375px:
  205 |   //
  206 |   //  1. Document overflow — the pagination nav was a single non-wrapping flex
  207 |   //     row (Previous + numbers + Next ~520px), so the whole document scrolled
  208 |   //     sideways. Guarded by the documentElement scrollWidth check. `flex-wrap`
  209 |   //     on the nav fixes this.
  210 |   //  2. Number-row overflow — even with the nav wrapping, the inner page-number
  211 |   //     row stayed a rigid ~320px unit that renders wider than the padded
  212 |   //     content column on sub-360px screens (buttons clipped at the screen
  213 |   //     edge). Guarded by asserting the number row is no wider than the
  214 |   //     viewport. `flex-wrap` on the number row fixes this.
  215 |   for (const width of [320, 375]) {
  216 |     test(`does not overflow horizontally on /media at ${width}px (mobile regression)`, async ({ page }) => {
  217 |       await page.setViewportSize({ width, height: 812 });
  218 |       await page.goto('/media');
  219 |       await page.waitForLoadState('domcontentloaded');
  220 | 
  221 |       // Pagination must be present for this page to exercise the regression.
  222 |       const pagination = page.locator('nav[aria-label="Pagination"]');
> 223 |       await expect(pagination).toBeVisible();
      |                                ^ Error: expect(locator).toBeVisible() failed
  224 | 
  225 |       const metrics = await page.evaluate(() => {
  226 |         const de = document.documentElement;
  227 |         const nav = document.querySelector('nav[aria-label="Pagination"]');
  228 |         const numberRow = nav?.querySelector('div') ?? null;
  229 |         return {
  230 |           docOverflow: de.scrollWidth - de.clientWidth,
  231 |           viewportWidth: de.clientWidth,
  232 |           numberRowWidth: numberRow ? numberRow.scrollWidth : 0,
  233 |         };
  234 |       });
  235 | 
  236 |       // (1) The document must not scroll sideways (allow 1px for rounding).
  237 |       expect(metrics.docOverflow).toBeLessThanOrEqual(1);
  238 |       // (2) The page-number row must not render wider than the screen.
  239 |       expect(metrics.numberRowWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  240 |     });
  241 |   }
  242 | });
  243 | 
```