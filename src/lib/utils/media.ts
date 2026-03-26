/**
 * Media URL utilities for the /media route.
 *
 * Parses media_url meta values into embeddable iframe src URLs.
 * Supports YouTube (all URL formats), VideoPress/video.wordpress.com,
 * and gracefully handles other URLs as external links.
 */

/** Extract a YouTube video ID from any YouTube URL variant. */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    // youtu.be/ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] || null
    // youtube.com/watch?v=ID
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      // youtube.com/live/ID or youtube.com/embed/ID or youtube.com/shorts/ID
      const match = u.pathname.match(/\/(live|embed|shorts|v)\/([^/?#]+)/)
      if (match) return match[2]
    }
  } catch { /* invalid URL */ }
  return null
}

/** Extract a VideoPress GUID from a videopress.com or video.wordpress.com URL. */
export function extractVideoPressGuid(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'videopress.com' || u.hostname === 'video.wordpress.com') {
      const match = u.pathname.match(/\/(?:v|embed)\/([^/?#]+)/)
      if (match) return match[1]
    }
  } catch { /* invalid URL */ }
  return null
}

export type MediaEmbedType = 'youtube' | 'videopress' | 'external'

export interface MediaEmbed {
  type: MediaEmbedType
  /** Ready-to-use iframe src, or null for external links */
  embedUrl: string | null
  /** Original URL — use as href for external links */
  originalUrl: string
}

/**
 * Resolve a media_url into an embed descriptor.
 * Returns the iframe src for embeddable types, or null for external links.
 */
export function resolveMediaEmbed(url: string): MediaEmbed {
  const ytId = extractYouTubeId(url)
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      originalUrl: url,
    }
  }

  const vpGuid = extractVideoPressGuid(url)
  if (vpGuid) {
    return {
      type: 'videopress',
      embedUrl: `https://video.wordpress.com/embed/${vpGuid}?hd=1&cover=1`,
      originalUrl: url,
    }
  }

  return { type: 'external', embedUrl: null, originalUrl: url }
}
