/**
 * Absolute URL for the site-wide OG card image fallback.
 *
 * Must be absolute because metadataBase points to jazzsequence.com (the
 * WordPress site) during the pre-migration period — relative paths like
 * `/opengraph-image` would resolve to the wrong domain and return 404 to
 * social crawlers. Once NEXT_PUBLIC_SITE_URL is set (post-migration or via
 * Pantheon Secrets), it drives the base; until then, next.jazzsequence.com
 * is the correct host for the Next.js app.
 */
export const OG_IMAGE_URL = `${
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://next.jazzsequence.com'
}/opengraph-image`
