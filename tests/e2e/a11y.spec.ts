/**
 * Accessibility tests — WCAG 2.1 AA compliance
 *
 * Uses axe-core via @axe-core/playwright to audit pages for WCAG 2.1 AA violations.
 * Critical and serious violations fail the test; moderate/minor are noted but not blocking.
 *
 * NOTE: Only /style-guide is tested here until the design system is applied globally.
 * Add other pages (homepage, posts, games, tag archive) to this file as each page
 * is updated to use the new design system.
 *
 * Run: npm run test:e2e -- --grep a11y
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function auditPage(page: Parameters<typeof AxeBuilder>[0], path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')

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

})
