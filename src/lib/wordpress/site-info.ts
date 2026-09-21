/**
 * WordPress Site Info Fetcher
 *
 * Fetches the site name and description from the WordPress REST API root endpoint.
 * Used to populate the Next.js layout metadata (title, description) from the
 * same source as jazzsequence.com rather than hardcoding values.
 */

const API_BASE_URL = process.env.WORDPRESS_API_URL || 'https://jazzsequence.com/wp-json/wp/v2'

// Derive root from WORDPRESS_API_URL — strip /wp/v2 suffix to get /wp-json root
const WP_ROOT_URL = (() => {
  try {
    const origin = new URL(API_BASE_URL).origin
    return `${origin}/wp-json`
  } catch {
    return 'https://jazzsequence.com/wp-json'
  }
})()

export interface SiteInfo {
  name: string
  description: string
  url: string
}

export interface SiteIcon {
  /** 32x32 — browser favicon */
  small: string
  /** 180x180 — apple-touch-icon */
  medium: string
}

/**
 * Fetch WordPress site name and description from the REST API root endpoint.
 *
 * Uses ISR with 1-hour revalidation. The root endpoint is public and requires
 * no authentication.
 */
export async function fetchSiteInfo(): Promise<SiteInfo> {
  const response = await fetch(WP_ROOT_URL, {
    next: { revalidate: 3600, tags: ['site-info'] },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch site info: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  return {
    name: data.name || 'jazzsequence',
    description: data.description || '',
    url: data.url || 'https://jazzsequence.com',
  }
}

/**
 * Fetch the WordPress Site Icon at the browser-favicon and apple-touch-icon sizes.
 *
 * WordPress registers `site_icon-32`/`site_icon-180` (and others) as media sub-sizes
 * of the attachment when a Site Icon is set in Settings > General. The root endpoint's
 * `site_icon_url` is the much larger "full" crop, so the sub-sizes are fetched
 * separately from the media endpoint by attachment ID (`site_icon`) and used when
 * available; the full-crop URL is the fallback if the media lookup fails or the
 * sub-sizes aren't there (e.g. a very small source image).
 *
 * Returns null only if no Site Icon is configured at all — callers should fall back
 * to a bundled static icon in that case.
 */
export async function fetchSiteIcon(): Promise<SiteIcon | null> {
  const rootResponse = await fetch(WP_ROOT_URL, {
    next: { revalidate: 3600, tags: ['site-info'] },
  })

  if (!rootResponse.ok) {
    throw new Error(`Failed to fetch site info: ${rootResponse.status} ${rootResponse.statusText}`)
  }

  const root = await rootResponse.json()
  const iconId = root.site_icon
  const fallbackUrl = root.site_icon_url as string | undefined

  if (!iconId && !fallbackUrl) {
    return null
  }

  if (iconId) {
    const mediaResponse = await fetch(`${WP_ROOT_URL}/wp/v2/media/${iconId}`, {
      next: { revalidate: 3600, tags: ['site-info'] },
    })

    if (mediaResponse.ok) {
      const media = await mediaResponse.json()
      const sizes = media.media_details?.sizes ?? {}
      const small = sizes['site_icon-32']?.source_url
      const medium = sizes['site_icon-180']?.source_url
      if (small && medium) {
        return { small, medium }
      }
    }
  }

  if (!fallbackUrl) {
    return null
  }

  return { small: fallbackUrl, medium: fallbackUrl }
}

/**
 * Fetch an icon image and wrap it in a Response suitable for a Next.js
 * `icon`/`apple-icon` route's default export.
 *
 * `Content-Type` is taken from WordPress's own response header — the only reliable
 * source, since WordPress serves the Site Icon in whatever format it was originally
 * uploaded as (commonly JPEG or PNG, and the URL's extension isn't a contract) —
 * falling back to `fallbackContentType` only if WordPress's response omits one.
 */
export async function buildIconResponse(imageUrl: string, fallbackContentType: string): Promise<Response> {
  const response = await fetch(imageUrl, { next: { revalidate: 3600, tags: ['site-info'] } })
  const imageData = await response.arrayBuffer()

  return new Response(imageData, {
    headers: { 'Content-Type': response.headers.get('content-type') || fallbackContentType },
  })
}
