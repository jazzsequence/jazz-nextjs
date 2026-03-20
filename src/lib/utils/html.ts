/**
 * Strip WordPress generated image size suffix from a URL to get the original.
 * WordPress appends "-WxH" to filenames before the extension for resized copies.
 * Example: "photo-800x600.jpg" → "photo.jpg"
 */
export function stripWordPressSize(url: string): string {
  return url.replace(/-\d+x\d+(\.[^.?#]+)/, '$1')
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
