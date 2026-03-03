/**
 * Transform WordPress menu URLs to local routes
 *
 * Converts jazzsequence.com URLs to local paths while preserving external URLs.
 *
 * Examples:
 * - https://jazzsequence.com/music/ → /music/
 * - https://jazzsequence.com → /
 * - https://github.com/user → https://github.com/user (unchanged)
 */
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

    // Check if it's a jazzsequence.com URL
    if (parsedUrl.hostname === 'jazzsequence.com') {
      // Transform to local path
      const path = parsedUrl.pathname;
      const search = parsedUrl.search;
      const hash = parsedUrl.hash;

      // Combine path, query, and hash
      return `${path}${search}${hash}`;
    }

    // External URL - return unchanged
    return url;
  } catch {
    // Not a valid URL - return as is
    return url;
  }
}
