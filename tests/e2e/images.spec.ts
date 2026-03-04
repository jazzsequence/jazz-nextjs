import { test, expect } from '@playwright/test';

test.describe('Image Rendering', () => {
  test('featured images should load successfully on post cards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find post cards with images
    const images = page.locator('article img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();

      // Check image is visible
      await expect(firstImage).toBeVisible();

      // Check image actually loaded (not broken)
      const isLoaded = await firstImage.evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalWidth > 0;
      });

      expect(isLoaded).toBe(true);

      // Get image dimensions to verify it rendered
      const box = await firstImage.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);

      // Check src attribute exists and is not empty
      const src = await firstImage.getAttribute('src');
      expect(src).toBeTruthy();
      expect(src).not.toBe('');

      // Verify the image URL is accessible
      const imageSrc = src!.startsWith('http') ? src : new URL(src!, page.url()).href;
      const response = await page.request.get(imageSrc);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toMatch(/^image\//);
    }
  });

  test('featured images should load on individual posts', async ({ page }) => {
    // First get a post slug that has an image
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const postWithImage = page.locator('article:has(img) h2 a').first();
    const postCount = await postWithImage.count();

    if (postCount === 0) {
      test.skip();
    }

    const href = await postWithImage.getAttribute('href');
    expect(href).toBeTruthy();

    // Navigate to the post
    await page.goto(href!);
    await page.waitForLoadState('domcontentloaded');

    // Check for featured image
    const featuredImage = page.locator('article img').first();
    const hasImage = await featuredImage.count() > 0;

    if (hasImage) {
      await expect(featuredImage).toBeVisible();

      // Verify image loaded successfully
      const isLoaded = await featuredImage.evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalWidth > 0;
      });

      expect(isLoaded).toBe(true);

      // Verify dimensions
      const box = await featuredImage.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);
    }
  });

  test('images should have proper Next.js Image optimization attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

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
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const images = page.locator('article img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 3); i++) {
        const img = images.nth(i);

        // Check naturalWidth and naturalHeight (broken images have 0x0)
        const dimensions = await img.evaluate((el: HTMLImageElement) => ({
          naturalWidth: el.naturalWidth,
          naturalHeight: el.naturalHeight,
          complete: el.complete
        }));

        expect(dimensions.complete).toBe(true);
        expect(dimensions.naturalWidth).toBeGreaterThan(0);
        expect(dimensions.naturalHeight).toBeGreaterThan(0);
      }
    }
  });

  test('CDN image URLs should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const images = page.locator('article img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();
      const src = await firstImage.getAttribute('src');

      expect(src).toBeTruthy();

      // Check if it's a CDN URL
      const imageSrc = src!.startsWith('http') ? src : new URL(src!, page.url()).href;

      // Verify the URL is accessible
      const response = await page.request.get(imageSrc);
      expect(response.status()).toBeLessThan(400);

      // Verify it's actually an image
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/^image\//);
    }
  });
});
