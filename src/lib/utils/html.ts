/**
 * Strip WordPress generated image size suffix from a URL to get the original.
 * WordPress appends "-WxH" to filenames before the extension for resized copies.
 * Example: "photo-800x600.jpg" → "photo.jpg"
 */
export function stripWordPressSize(url: string): string {
  return url.replace(/-\d+x\d+(\.[^.?#]+)/, '$1')
}

/**
 * Normalize WordPress media URLs by removing double slashes in the path.
 *
 * WordPress sometimes stores upload paths with a double slash
 * (e.g. /wp-content/uploads//2017/01/image.jpg). Web servers may or may not
 * normalize this, and Next.js image optimization returns 404 for those URLs.
 * This fixes it by collapsing consecutive slashes in the path portion only —
 * the protocol's // (https://) is preserved via the negative lookbehind on ":".
 */
export function normalizeWordPressUrl(url: string): string {
  return url.replace(/([^:])\/\//g, '$1/')
}

/**
 * Decode HTML entities in strings from the WordPress REST API.
 *
 * WordPress runs titles through wptexturize(), which converts ASCII punctuation
 * to Unicode smart quotes/dashes encoded as HTML entities (e.g. &#8217; → ').
 * React escapes & → &amp; when rendering text nodes, so &#8217; would display
 * literally as &#8217; rather than '. Decode before passing to React.
 */
export function decodeHtmlEntities(str: string): string {
  return str
    // Numeric entities: &#8217; → ' etc.
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    // Hex entities: &#x2019; → '
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Named entities WordPress commonly produces
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, '\u00a0')
}

/**
 * Convert a WordPress excerpt to a plain-text OG description.
 *
 * Strips the Organize Series plugin's "This entry is part X of Y in the series Z"
 * block (`.pps-series-post-details`) before removing all remaining HTML tags,
 * then trims and truncates to 160 characters.
 *
 * The series block is prepended to excerpts by the plugin's filter on
 * `the_excerpt`, so it appears in the REST API `excerpt.rendered` field.
 * It must be removed before the excerpt is used as an OG meta description.
 */
export function excerptToDescription(excerpt: string | undefined | null): string | undefined {
  if (!excerpt) return undefined

  const text = excerpt
    // Remove the pps-series-post-details block (Organize Series plugin)
    .replace(/<div[^>]*class="[^"]*pps-series-post-details[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '')
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, '')
    .trim()
    .slice(0, 160)

  return text || undefined
}
