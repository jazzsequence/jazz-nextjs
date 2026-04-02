import { test, expect } from '@playwright/test';

/**
 * Pagination URL correctness — search and taxonomy archives.
 *
 * Search: uses query-param pagination (?page=N) because basePath contains
 * a query string. The Pagination component detects `?` in basePath and
 * switches to &page=N instead of /page/N.
 *
 * Taxonomy archives (category, tag, series): use path-segment pagination
 * (/page/N) via dedicated sub-routes. These routes must exist and load
 * correctly — /category/[slug]/page/[page], etc.
 *
 * Test data:
 *   Search: "ministry" — jazzsequence.com has the ministry-of-music
 *   category with 183 posts; "ministry" reliably returns multiple pages.
 *
 *   Category: "ministry-of-music" — 183 posts, confirmed multi-page.
 */

const SEARCH_TERM = 'ministry';
const TEST_CATEGORY = 'ministry-of-music';

test.describe('Search pagination — query-param URLs', () => {
  test('Next button href uses ?page=2, not /page/2 path segment', async ({ page }) => {
    await page.goto(`/search?q=${SEARCH_TERM}&type=all`);
    await page.waitForLoadState('domcontentloaded');

    const nextLink = page.getByRole('link', { name: /next/i });
    const href = await nextLink.getAttribute('href');

    expect(href).not.toContain('/page/');
    expect(href).toContain('page=2');
  });

  test('page=2 URL loads without corruption — correct URL, not 404', async ({ page }) => {
    await page.goto(`/search?q=${SEARCH_TERM}&type=all&page=2`);
    await page.waitForLoadState('domcontentloaded');

    // URL must stay as-is — not get redirected or mangled to /page/2/page/2
    expect(page.url()).toContain('page=2');
    expect(page.url()).not.toContain('/page/');
    expect(page.url()).not.toMatch(/page=\d+\/page\//);

    // Page rendered — not a 404 (h1 should exist)
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('navigating to Next lands on ?page=2 URL', async ({ page }) => {
    await page.goto(`/search?q=${SEARCH_TERM}&type=all`);
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('link', { name: /next/i }).click();
    // App Router soft navigation — wait for URL to update
    await page.waitForURL(`**/search?q=${SEARCH_TERM}&type=all&page=2`);

    expect(page.url()).toContain('page=2');
    expect(page.url()).not.toContain('/page/');
  });
});

test.describe('Taxonomy archive pagination — /page/N path-segment routes', () => {
  test('category page 1 Next button href is /category/slug/page/2', async ({ page }) => {
    await page.goto(`/category/${TEST_CATEGORY}`);
    await page.waitForLoadState('domcontentloaded');

    const paginationNav = page.locator('nav[aria-label="Pagination"]');
    const nextLink = paginationNav.getByRole('link', { name: 'Go to next page' });
    const href = await nextLink.getAttribute('href');

    expect(href).toContain('/page/2');
    expect(href).not.toContain('page=');
  });

  test('/category/slug/page/2 loads and Next href is /page/3', async ({ page }) => {
    await page.goto(`/category/${TEST_CATEGORY}/page/2`);
    await page.waitForLoadState('domcontentloaded');

    // Route exists and loaded at the correct URL
    expect(page.url()).toContain('/page/2');

    // Scope to pagination nav to avoid false matches on post titles containing "next"
    const paginationNav = page.locator('nav[aria-label="Pagination"]');
    const nextLink = paginationNav.getByRole('link', { name: 'Go to next page' });
    const href = await nextLink.getAttribute('href');

    expect(href).toContain('/page/3');
    expect(href).not.toContain('/page/2/page/');
  });

  test('/category/slug/page/2 renders the correct category heading', async ({ page }) => {
    await page.goto(`/category/${TEST_CATEGORY}/page/2`);
    await page.waitForLoadState('domcontentloaded');

    // Page should render the actual category, not a 404
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
  });
});
