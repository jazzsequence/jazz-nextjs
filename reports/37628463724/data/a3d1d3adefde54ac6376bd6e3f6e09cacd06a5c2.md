# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: post-single.spec.ts >> Individual Post Page >> should display post title
- Location: tests/e2e/post-single.spec.ts:26:3

# Error details

```
Error: Could not find a post link on https://pr-141-jazz-nextjs15.pantheonsite.io/ (HTTP 429); body starts: <!DOCTYPE HTML> <html> <head> <title>429 - Too Many Requests</title> <meta charset="utf-8" /> <meta name="
```

# Test source

```ts
  1   | import { test, expect } from './fixtures';
  2   | 
  3   | test.describe('Individual Post Page', () => {
  4   |   let testSlug: string;
  5   | 
  6   |   // Get a real post slug before running tests
  7   |   test.beforeAll(async ({ api }) => {
  8   |     const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  9   |     const response = await api.get(`${baseUrl}/`);
  10  |     const html = await response.text();
  11  | 
  12  |     // Extract first post slug from homepage
  13  |     const match = html.match(/href="\/posts\/([^"]+)"/);
  14  |     if (!match?.[1]) {
  15  |       // No made-up fallback slug: a post that doesn't exist renders "Unable to load post", so
  16  |       // every test here would fail on a page that says nothing about why. Fail once, with the
  17  |       // status and the start of the body, instead.
> 18  |       throw new Error(
      |             ^ Error: Could not find a post link on https://pr-141-jazz-nextjs15.pantheonsite.io/ (HTTP 429); body starts: <!DOCTYPE HTML> <html> <head> <title>429 - Too Many Requests</title> <meta charset="utf-8" /> <meta name="
  19  |         `Could not find a post link on ${baseUrl}/ (HTTP ${response.status()}); ` +
  20  |           `body starts: ${html.slice(0, 120).replace(/\s+/g, ' ')}`,
  21  |       );
  22  |     }
  23  |     testSlug = match[1];
  24  |   });
  25  | 
  26  |   test('should display post title', async ({ page }) => {
  27  |     await page.goto(`/posts/${testSlug}`);
  28  | 
  29  |     const heading = page.locator('h1');
  30  |     await expect(heading).toBeVisible();
  31  | 
  32  |     const titleText = await heading.textContent();
  33  |     expect(titleText).toBeTruthy();
  34  |     expect(titleText?.length).toBeGreaterThan(0);
  35  |   });
  36  | 
  37  |   test('should display post content', async ({ page }) => {
  38  |     await page.goto(`/posts/${testSlug}`);
  39  | 
  40  |     // Content should be in article element — use first() since embedded article
  41  |     // cards (ArticleCard) also render <article> tags inside the post body.
  42  |     const article = page.locator('article').first();
  43  |     await expect(article).toBeVisible();
  44  | 
  45  |     // Should have some text content
  46  |     const content = await article.textContent();
  47  |     expect(content).toBeTruthy();
  48  |     expect(content?.length).toBeGreaterThan(50); // Reasonable content length
  49  |   });
  50  | 
  51  |   test('should display post date', async ({ page }) => {
  52  |     await page.goto(`/posts/${testSlug}`);
  53  | 
  54  |     const date = page.locator('time');
  55  |     await expect(date).toBeVisible();
  56  |   });
  57  | 
  58  |   test('should display featured image if available', async ({ page }) => {
  59  |     await page.goto(`/posts/${testSlug}`);
  60  |     await page.waitForLoadState('domcontentloaded');
  61  | 
  62  |     // Featured image is optional, so check if it exists
  63  |     const image = page.locator('article img').first();
  64  |     const imageExists = await image.count() > 0;
  65  | 
  66  |     if (imageExists) {
  67  |       await expect(image).toBeVisible();
  68  |     }
  69  |   });
  70  | 
  71  |   test('should safely render HTML content', async ({ page }) => {
  72  |     await page.goto(`/posts/${testSlug}`);
  73  | 
  74  |     // Content should be rendered (not showing raw HTML)
  75  |     const article = page.locator('article').first();
  76  | 
  77  |     // Should not contain escaped HTML entities in normal text
  78  |     const visibleText = await article.textContent();
  79  |     expect(visibleText).not.toContain('&lt;');
  80  |     expect(visibleText).not.toContain('&gt;');
  81  |   });
  82  | 
  83  |   test('should handle 404 for non-existent posts', async ({ page }) => {
  84  |     const response = await page.goto('/posts/this-post-definitely-does-not-exist-12345');
  85  | 
  86  |     // Should return 404 or show not found page
  87  |     if (response) {
  88  |       const status = response.status();
  89  |       // Accept 404 or 200 with "not found" content
  90  |       expect([200, 404]).toContain(status);
  91  |     }
  92  | 
  93  |     // Should show some indication of not found
  94  |     const body = page.locator('body');
  95  |     const text = await body.textContent();
  96  | 
  97  |     // Check for 404 or not found indicators
  98  |     const hasNotFoundIndicator =
  99  |       text?.toLowerCase().includes('not found') ||
  100 |       text?.toLowerCase().includes('404') ||
  101 |       text?.toLowerCase().includes('does not exist');
  102 | 
  103 |     expect(hasNotFoundIndicator).toBe(true);
  104 |   });
  105 | 
  106 |   test('should have navigation back to posts', async ({ page }) => {
  107 |     await page.goto(`/posts/${testSlug}`);
  108 | 
  109 |     // Should have navigation menu with link to posts
  110 |     const nav = page.locator('nav[role="navigation"]');
  111 |     await expect(nav).toBeVisible();
  112 |   });
  113 | 
  114 |   test('should have footer', async ({ page }) => {
  115 |     await page.goto(`/posts/${testSlug}`);
  116 | 
  117 |     const footer = page.locator('footer');
  118 |     await expect(footer).toBeVisible();
```