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
