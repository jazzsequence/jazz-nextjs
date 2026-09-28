import { test, expect, type Page } from '@playwright/test'

// Serialize, for the same reason as games.spec.ts: several workers landing on /media
// at once on a cold Turbopack start compile the route in parallel and blow the
// navigation timeout. The first test compiles it; the rest reuse it.
test.describe.configure({ mode: 'serial' })

/**
 * Titles of the media cards currently rendered, in order.
 *
 * Scoped to the grid rather than `main`, because the intro content comes from a
 * WordPress page and may contain headings of its own.
 */
async function cardTitles(page: Page): Promise<string[]> {
  return page.getByTestId('media-grid').locator('h2').allTextContents()
}

/**
 * Hrefs of the pagination links that actually go somewhere.
 *
 * Previous/Next are rendered as `#` on the first and last page, and on page 1 the
 * Next link duplicates the "2" link — so this is a set of destinations to check the
 * shape of, not a list to count.
 */
async function pageLinkHrefs(page: Page): Promise<string[]> {
  const hrefs = await page
    .locator('nav[aria-label="Pagination"] a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  return [...new Set(hrefs.filter((href): href is string => !!href && href !== '#'))]
}

/** The highest page number rendered in the pagination nav, or 1 with no nav at all. */
async function lastPageNumber(page: Page): Promise<number> {
  const numbers = await page
    .locator('nav[aria-label="Pagination"] a[aria-label^="Go to page "]')
    .evaluateAll((links) =>
      links.map((link) => Number(link.getAttribute('aria-label')?.replace('Go to page ', '')))
    )
  return numbers.length > 0 ? Math.max(...numbers) : 1
}

test.describe('Media type filters', () => {
  test('renders a filter pill for every media type, with All current', async ({ page }) => {
    // Extra timeout on first navigation — Turbopack compiles /media on first access.
    await page.goto('/media', { waitUntil: 'domcontentloaded', timeout: 90000 })

    const filters = page.getByTestId('media-filters')
    await expect(filters).toBeVisible()

    const all = filters.getByRole('link', { name: 'All' })
    await expect(all).toHaveAttribute('aria-current', 'page')

    // More than just All: a taxonomy that returned no terms would render nothing,
    // and a broken terms fetch would leave the All pill alone.
    expect(await filters.getByRole('link').count()).toBeGreaterThan(1)
    await expect(filters.getByRole('link', { name: 'Podcast' })).toBeVisible()
  })

  test('choosing a pill filters the listing down to a different set', async ({ page }) => {
    await page.goto('/media', { waitUntil: 'domcontentloaded' })
    const unfiltered = await cardTitles(page)
    expect(unfiltered.length).toBeGreaterThan(0)

    await page.getByTestId('media-filters').getByRole('link', { name: 'Video' }).click()
    await expect(page).toHaveURL(/\/media\?type=video/)

    const filtered = await cardTitles(page)
    // Non-empty catches the filter failing closed (sending a slug where the REST
    // endpoint wants a term id returns 400, which would empty the grid); differing
    // from the unfiltered listing catches it failing open — the parameter being
    // dropped and the same first page coming back.
    expect(filtered.length).toBeGreaterThan(0)
    expect(filtered).not.toEqual(unfiltered)

    await expect(
      page.getByTestId('media-filters').getByRole('link', { name: 'Video' })
    ).toHaveAttribute('aria-current', 'page')
  })

  test('a filtered view titles itself after the active type', async ({ page }) => {
    await page.goto('/media?type=podcast', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveTitle(/Podcast/)
    expect((await cardTitles(page)).length).toBeGreaterThan(0)
  })

  test('pagination on a filtered view carries the filter in the query string', async ({ page }) => {
    // Podcast is by some distance the largest media type, so it spans several pages
    // of 12 and reliably renders pagination.
    await page.goto('/media?type=podcast', { waitUntil: 'domcontentloaded' })

    const pagination = page.locator('nav[aria-label="Pagination"]')
    await expect(pagination).toBeVisible()

    // Every real destination must keep the filter and use `&page=`, not `/page/`,
    // which would drop the filter and land on the unfiltered archive route.
    const hrefs = await pageLinkHrefs(page)
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href).toMatch(/^\/media\?type=podcast(&page=\d+)?$/)
    }
  })

  test('page 2 of a filtered view still shows that type', async ({ page }) => {
    await page.goto('/media?type=podcast', { waitUntil: 'domcontentloaded' })
    const firstPage = await cardTitles(page)

    await page.goto('/media?type=podcast&page=2', { waitUntil: 'domcontentloaded' })
    const secondPage = await cardTitles(page)

    expect(secondPage.length).toBeGreaterThan(0)
    expect(secondPage).not.toEqual(firstPage)
    await expect(
      page.getByTestId('media-filters').getByRole('link', { name: 'Podcast' })
    ).toHaveAttribute('aria-current', 'page')
  })

  test('an unknown type renders the unfiltered listing rather than an error', async ({ page }) => {
    await page.goto('/media', { waitUntil: 'domcontentloaded' })
    const unfilteredCount = (await cardTitles(page)).length
    const unfilteredLastPage = await lastPageNumber(page)
    expect(unfilteredCount).toBeGreaterThan(0)

    const response = await page.goto('/media?type=not-a-real-type', {
      waitUntil: 'domcontentloaded',
    })

    expect(response?.status()).toBe(200)
    // Same page size and page count as the real unfiltered listing — an unknown type
    // must fall through to the unfiltered query rather than being sent to WordPress as
    // a filter, which would 400 or (for an id that happens to resolve) return a
    // differently-sized result set. This deliberately does NOT compare exact card
    // *titles* against the earlier /media snapshot: both requests share the `media`
    // ISR cache tag, and a background revalidation landing between the two navigations
    // legitimately swaps in a newer generation (stale-while-revalidate — see the
    // GcsCacheHandler note in CLAUDE.md) without either page being unfiltered.
    expect(await cardTitles(page)).toHaveLength(unfilteredCount)
    expect(await lastPageNumber(page)).toBe(unfilteredLastPage)
    await expect(
      page.getByTestId('media-filters').getByRole('link', { name: 'All' })
    ).toHaveAttribute('aria-current', 'page')
  })

  test('the unfiltered listing keeps its path-based pagination', async ({ page }) => {
    await page.goto('/media', { waitUntil: 'domcontentloaded' })

    const pagination = page.locator('nav[aria-label="Pagination"]')
    await expect(pagination).toBeVisible()

    const hrefs = await pageLinkHrefs(page)
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href).toMatch(/^\/media(\/page\/\d+)?$/)
    }
  })
})
