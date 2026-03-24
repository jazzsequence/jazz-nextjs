/**
 * Transform WordPress menu URLs to local routes
 *
 * Converts WordPress backend URLs to local paths while preserving external URLs.
 * The backend hostname is derived from WORDPRESS_API_URL / WORDPRESS_BASE_URL so
 * migrating the WordPress backend to a different host only requires an env var change.
 *
 * Examples:
 * - https://jazzsequence.com/music/ → /music/
 * - https://jazzsequence.com → /
 * - https://github.com/user → https://github.com/user (unchanged)
 */

// Resolve the WordPress backend hostname from env vars (build-time).
const WP_BACKEND_HOSTNAME = (() => {
  const raw = process.env.WORDPRESS_BASE_URL || process.env.WORDPRESS_API_URL
  if (raw) {
    try { return new URL(raw).hostname } catch { /* fall through */ }
  }
  return 'jazzsequence.com'
})()

export function transformMenuUrl(url: string): string {
  // Handle empty or malformed URLs
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  // Already a relative URL - keep as is
  if (url.startsWith('/')) {
    return url;
  }

  // Protocol-relative URL (//example.com) - keep as is
  if (url.startsWith('//')) {
    return url;
  }

  // Try to parse as URL
  try {
    const parsedUrl = new URL(url);

    // Convert WordPress backend URLs to local paths
    if (parsedUrl.hostname === WP_BACKEND_HOSTNAME) {
      const path = parsedUrl.pathname;
      const search = parsedUrl.search;
      const hash = parsedUrl.hash;
      return `${path}${search}${hash}`;
    }

    // External URL - return unchanged
    return url;
  } catch {
    // Not a valid URL - return as is
    return url;
  }
}
