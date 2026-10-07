import { test, expect } from './fixtures';
import { botBypassHeaders } from './support/bot-bypass';

// page.request is not covered by the context route in fixtures.ts, and `src` may be the app
// origin (/_next/image, needs the token) or the external CDN (must not get it) — so decide per URL.
const imageRequestHeaders = (url: string, baseURL: string | undefined) =>
  botBypassHeaders(url, baseURL, process.env.BOT_BYPASS_TOKEN);

test.describe('Image Rendering', () => {
  test('images should have proper Next.js Image optimization attributes', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const images = page.locator('article img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();

      // Check for Next.js Image component attributes
      const srcset = await firstImage.getAttribute('srcset');
      const sizes = await firstImage.getAttribute('sizes');

      // Next.js Image should generate srcset for responsive images
      // Note: This might not exist if images are broken
      if (srcset) {
        expect(srcset.length).toBeGreaterThan(0);
      }

      if (sizes) {
        expect(sizes.length).toBeGreaterThan(0);
      }
    }
  });

  test('images should not show broken image icon', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const images = page.locator('article img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);

        await expect.poll(() =>
          img.evaluate((el: HTMLImageElement) => el.complete)
        ).toBe(true);

        // Broken images report 0x0 once complete
        const dimensions = await img.evaluate((el: HTMLImageElement) => ({
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight
        }));

        expect(dimensions.naturalWidth).toBeGreaterThan(0);
        expect(dimensions.naturalHeight).toBeGreaterThan(0);
      }
    }
  });

  test('CDN image URLs should be accessible', async ({ page, baseURL }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const images = page.locator('article img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      const src = await firstImage.getAttribute('src');

      expect(src).toBeTruthy();

      // Check if it's a CDN URL
      const imageSrc = src!.startsWith('http') ? src : new URL(src!, page.url()).href;

      // Verify the URL is accessible
      const response = await page.request.get(imageSrc, {
        headers: imageRequestHeaders(imageSrc, baseURL),
      });
      expect(response.status()).toBeLessThan(400);

      // Verify it's actually an image
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/^image\//);
    }
  });
});
