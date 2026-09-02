/**
 * Accessibility tests — WCAG 2.1 AA compliance
 *
 * Uses axe-core via @axe-core/playwright to audit pages for WCAG 2.1 AA violations.
 * Critical and serious violations fail the test; moderate/minor are noted but not blocking.
 *
 * Add pages to this file as they are updated to use the design system.
 * Pages not yet updated will fail — that is expected and surfaces issues to fix.
 *
 * Run: npm run test:e2e -- --grep a11y
 */

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * `readySelector` must be an element that only exists once the content under audit is
 * actually in the DOM. Defaults to `main`, which is server-rendered on every audited
 * page. Pages with client-rendered content must pass their own selector, or axe races
 * hydration and silently audits an incomplete DOM.
 *
 * Deliberately not `waitForLoadState('networkidle')`: that needs 500ms of zero network
 * activity, which image-heavy pages behind a CDN may never reach, and it timed out
 * intermittently on / and /posts. axe audits the DOM, so it needs markup present, not
 * every asset fetched (`image-alt` inspects the <img> element, not its bytes).
 */
async function auditPage(page: Page, path: string, readySelector = 'main') {
  await page.goto(path)
  await expect(page.locator(readySelector)).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(WCAG_AA_TAGS)
    .analyze()

  const blocking = results.violations.filter(
    v => v.impact === 'critical' || v.impact === 'serious'
  )

  if (blocking.length > 0) {
    const summary = blocking.map(v =>
      `[${v.impact}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes.map(n => n.html).slice(0, 2).join('\n  ')}`
    ).join('\n\n')
    throw new Error(`WCAG 2.1 AA violations on ${path}:\n\n${summary}`)
  }

  return results
}

test.describe('Accessibility — WCAG 2.1 AA', () => {

  test('style guide has no critical/serious a11y violations', async ({ page }) => {
    const results = await auditPage(page, '/style-guide')
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('homepage has no critical/serious a11y violations', async ({ page }) => {
    // GreetingClient returns null until its first effect resolves, so it is absent from
    // the SSR HTML while <main> is already visible. Waiting on `main` would audit the
    // page before the greeting mounts — and the greeting carries the <h1> plus the
    // color-contrast and link-name surface most at risk under WCAG_AA_TAGS.
    const results = await auditPage(page, '/?greeting=morning', '[data-testid="greeting-card"]')
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('posts list has no critical/serious a11y violations', async ({ page }) => {
    const results = await auditPage(page, '/posts')
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('games page has no critical/serious a11y violations', async ({ page }) => {
    const results = await auditPage(page, '/games')
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('music page has no critical/serious a11y violations', async ({ page }) => {
    const results = await auditPage(page, '/music')
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('about page has no critical/serious a11y violations', async ({ page }) => {
    const results = await auditPage(page, '/about')
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('tag archive has no critical/serious a11y violations', async ({ page }) => {
    const results = await auditPage(page, '/tag/teh-s3quence')
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

})
