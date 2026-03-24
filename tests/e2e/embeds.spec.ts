/**
 * E2E tests — WordPress oEmbed rendering
 *
 * Verifies that embed content in real posts renders with the correct
 * class hierarchy, that iframes load, and that social scripts are
 * injected for script-driven providers.
 *
 * Posts confirmed via WordPress MCP:
 *
 *   Gutenberg block embeds (wp-block-embed-* CSS class structure):
 *     wordcamp-canada-eh      → YouTube (9:16)
 *     binary-jazz             → Twitter + YouTube (16:9)
 *     why-you-should-care-about-whats-happening-with-portlands-professional-soccer-teams
 *                             → Twitter (additional post with multiple tweets)
 *     gene                    → Spotify
 *     disclosing-ai-use       → WordPress native wp-embed (communitycode.dev)
 *     i-was-on-the-wp-tavern-podcast → WordPress native wp-embed (wptavern.com)
 *
 *   Older raw iframe embeds (no Gutenberg block classes, still rendered via PostContent):
 *     free-download-beyonce-end-of-time-2-step-remix-by-jazzsequence → SoundCloud iframe
 *     teh-s3quence-halloween-2015 → Mixcloud iframe
 *
 *   No Gutenberg block posts found for:
 *     Vimeo, DailyMotion, VideoPress, WordPress.tv, ReverbNation,
 *     TikTok, Instagram, Imgur, Tumblr, Reddit, SlideShare, Flickr
 *     — these are covered by unit tests (EmbedBlock + SocialScriptLoader)
 */

import { test, expect } from '@playwright/test';

const TWITTER_POST = '/posts/why-you-should-care-about-whats-happening-with-portlands-professional-soccer-teams';

// ── YouTube ─────────────────────────────────────────────────────────────────────

test.describe('Embed — YouTube', () => {
  test('renders iframe with youtube.com/embed src', async ({ page }) => {
    await page.goto('/posts/wordcamp-canada-eh');
    await page.waitForLoadState('domcontentloaded');

    const iframe = page.locator('.wp-block-embed-youtube iframe').first();
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('youtube.com/embed');
  });

  test('figure has is-type-video, is-provider-youtube, wp-has-aspect-ratio classes', async ({ page }) => {
    await page.goto('/posts/wordcamp-canada-eh');
    await page.waitForLoadState('domcontentloaded');

    const figure = page.locator('figure.wp-block-embed-youtube').first();
    await expect(figure).toBeVisible();
    await expect(figure).toHaveClass(/is-type-video/);
    await expect(figure).toHaveClass(/is-provider-youtube/);
    await expect(figure).toHaveClass(/wp-has-aspect-ratio/);
  });

  test('binary-jazz 16:9 YouTube embed has correct aspect ratio class', async ({ page }) => {
    await page.goto('/posts/binary-jazz');
    await page.waitForLoadState('domcontentloaded');

    const figure = page.locator('figure.wp-block-embed-youtube.wp-embed-aspect-16-9').first();
    await expect(figure).toBeAttached();
    const iframe = figure.locator('iframe');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('youtube.com/embed');
  });
});

// ── Twitter / X ─────────────────────────────────────────────────────────────────

test.describe('Embed — Twitter/X', () => {
  test('figure has is-type-rich and is-provider-twitter classes', async ({ page }) => {
    await page.goto(TWITTER_POST);
    await page.waitForLoadState('domcontentloaded');

    const figure = page.locator('figure.wp-block-embed-twitter').first();
    await expect(figure).toBeAttached();
    await expect(figure).toHaveClass(/is-provider-twitter/);
    await expect(figure).toHaveClass(/is-type-rich/);
  });

  test('injects Twitter widgets.js via SocialScriptLoader', async ({ page }) => {
    await page.goto(TWITTER_POST);
    await page.waitForLoadState('networkidle');

    const script = page.locator('script[data-social-embed="twitter"]');
    await expect(script).toBeAttached();
  });

  test('binary-jazz has multiple Twitter embed figures', async ({ page }) => {
    await page.goto('/posts/binary-jazz');
    await page.waitForLoadState('domcontentloaded');

    const figures = page.locator('figure.wp-block-embed-twitter');
    const count = await figures.count();
    expect(count).toBeGreaterThan(1);
  });
});

// ── Spotify ─────────────────────────────────────────────────────────────────────

test.describe('Embed — Spotify', () => {
  test('figure has is-type-rich and is-provider-spotify classes', async ({ page }) => {
    await page.goto('/posts/gene');
    await page.waitForLoadState('domcontentloaded');

    const figure = page.locator('figure.wp-block-embed-spotify').first();
    await expect(figure).toBeAttached();
    await expect(figure).toHaveClass(/is-provider-spotify/);
    await expect(figure).toHaveClass(/is-type-rich/);
  });

  test('renders iframe with open.spotify.com/embed src', async ({ page }) => {
    await page.goto('/posts/gene');
    await page.waitForLoadState('domcontentloaded');

    const iframe = page.locator('.wp-block-embed-spotify iframe').first();
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('open.spotify.com/embed');
  });
});

// ── SoundCloud (old-format raw iframe) ─────────────────────────────────────────

test.describe('Embed — SoundCloud (raw iframe)', () => {
  // This post predates Gutenberg — uses raw <iframe src="w.soundcloud.com/player/...">
  // DOMPurify allows iframes; the iframe renders even without wp-block-embed classes.
  test('renders SoundCloud iframe', async ({ page }) => {
    await page.goto('/posts/free-download-beyonce-end-of-time-2-step-remix-by-jazzsequence');
    await page.waitForLoadState('domcontentloaded');

    const iframe = page.locator('iframe[src*="soundcloud.com"]').first();
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('soundcloud.com');
  });

  test('post renders without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isThirdParty = ['soundcloud.com', 'sndcdn.com'].some(d => text.includes(d));
        if (!isThirdParty) consoleErrors.push(text);
      }
    });

    await page.goto('/posts/free-download-beyonce-end-of-time-2-step-remix-by-jazzsequence');
    await page.waitForLoadState('domcontentloaded');

    expect(consoleErrors).toHaveLength(0);
  });
});

// ── Mixcloud (old-format raw iframe) ───────────────────────────────────────────

test.describe('Embed — Mixcloud (raw iframe)', () => {
  // Pre-Gutenberg post — uses raw <iframe src="mixcloud.com/widget/iframe/...">
  test('renders Mixcloud iframe', async ({ page }) => {
    await page.goto('/posts/teh-s3quence-halloween-2015');
    await page.waitForLoadState('domcontentloaded');

    const iframe = page.locator('iframe[src*="mixcloud.com"]').first();
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute('src');
    expect(src).toContain('mixcloud.com');
  });

  test('post renders without first-party console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Old embeds (pre-HTTPS) may cause mixed content or third-party errors — ignore those
        const isIgnorable = [
          'mixcloud.com', 'w.soundcloud.com', 'Mixed Content',
          'soundcloud.com', 'cdn.mixcloud.com',
        ].some(d => text.includes(d));
        if (!isIgnorable) consoleErrors.push(text);
      }
    });

    await page.goto('/posts/teh-s3quence-halloween-2015');
    await page.waitForLoadState('domcontentloaded');

    expect(consoleErrors).toHaveLength(0);
  });
});

// ── WordPress native post embed ─────────────────────────────────────────────────

test.describe('Embed — WordPress native post embed (is-type-wp-embed)', () => {
  test('disclosing-ai-use has wp-block-embed is-type-wp-embed figure', async ({ page }) => {
    await page.goto('/posts/disclosing-ai-use');
    await page.waitForLoadState('domcontentloaded');

    const figure = page.locator('figure.wp-block-embed.is-type-wp-embed').first();
    await expect(figure).toBeAttached();
    // The wp-embed wrapper div should be present
    await expect(figure.locator('.wp-block-embed__wrapper')).toBeAttached();
  });

  test('wp-tavern podcast post has is-type-wp-embed figure', async ({ page }) => {
    await page.goto('/posts/i-was-on-the-wp-tavern-podcast');
    await page.waitForLoadState('domcontentloaded');

    const figure = page.locator('figure.wp-block-embed.is-type-wp-embed').first();
    await expect(figure).toBeAttached();
  });
});

// ── General embed structure ─────────────────────────────────────────────────────

test.describe('Embed — figure class hierarchy', () => {
  test('every wp-block-embed in article has a .wp-block-embed__wrapper child', async ({ page }) => {
    await page.goto('/posts/binary-jazz');
    await page.waitForLoadState('domcontentloaded');

    // Scope to article to avoid any decorative embeds outside the post body
    const embeds = page.locator('article .wp-block-embed');
    const count = await embeds.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const wrapper = embeds.nth(i).locator('.wp-block-embed__wrapper');
      await expect(wrapper).toBeAttached({ timeout: 5000 });
    }
  });

  test('video embeds have wp-has-aspect-ratio class', async ({ page }) => {
    await page.goto('/posts/binary-jazz');
    await page.waitForLoadState('domcontentloaded');

    const videoEmbed = page.locator('article .wp-block-embed-youtube.wp-has-aspect-ratio').first();
    await expect(videoEmbed).toBeAttached();
  });
});

// ── Error resilience ─────────────────────────────────────────────────────────────

test.describe('Embed — error resilience', () => {
  test('posts with embeds do not produce first-party console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isThirdParty = [
          'platform.twitter.com', 'instagram.com', 'tiktok.com',
          'assets.tumblr.com', 'open.spotify.com', 'youtube.com',
        ].some(d => text.includes(d));
        if (!isThirdParty) consoleErrors.push(text);
      }
    });

    await page.goto('/posts/binary-jazz');
    await page.waitForLoadState('domcontentloaded');
    expect(consoleErrors).toHaveLength(0);
  });

  test('embed iframes do not return 4xx errors', async ({ page }) => {
    const failedIframes: string[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/embed') && response.status() >= 400 && response.status() < 500) {
        failedIframes.push(`${response.status()} ${url}`);
      }
    });

    await page.goto('/posts/binary-jazz');
    await page.waitForLoadState('domcontentloaded');
    expect(failedIframes).toHaveLength(0);
  });

  test('Spotify post renders without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isThirdParty = ['open.spotify.com', 'spotify.com'].some(d => text.includes(d));
        if (!isThirdParty) consoleErrors.push(text);
      }
    });

    await page.goto('/posts/gene');
    await page.waitForLoadState('domcontentloaded');
    expect(consoleErrors).toHaveLength(0);
  });
});
