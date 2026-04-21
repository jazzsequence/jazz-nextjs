import { test, expect } from '@playwright/test';

/**
 * Comments E2E tests — run against the deployed Pantheon environment.
 *
 * Uses a known post with multiple approved comments to verify the full
 * comment section renders correctly on a real post page.
 */

const POST_WITH_COMMENTS = '/posts/in-defense-of-wapuu';

test.describe('Comment Section', () => {
  test('should display the comment section on a post with comments open', async ({ page }) => {
    await page.goto(POST_WITH_COMMENTS);
    const section = page.getByRole('region', { name: /comments/i });
    await expect(section).toBeVisible();
  });

  test('should display existing approved comments', async ({ page }) => {
    await page.goto(POST_WITH_COMMENTS);

    // At least one comment should be visible — the heading count will reflect it
    const heading = page.getByRole('heading', { name: /\d+ comment/i });
    await expect(heading).toBeVisible();
  });

  test('should display "Leave a Reply" form', async ({ page }) => {
    await page.goto(POST_WITH_COMMENTS);
    await expect(page.getByRole('heading', { name: /leave a reply/i })).toBeVisible();
    await expect(page.getByLabelText(/name/i)).toBeVisible();
    await expect(page.getByLabelText(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /post comment/i })).toBeVisible();
  });

  test('comment section should have no critical a11y violations', async ({ page }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;
    await page.goto(POST_WITH_COMMENTS);
    const section = page.getByRole('region', { name: /comments/i });
    await expect(section).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="comments-heading"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toHaveLength(0);
  });
});
