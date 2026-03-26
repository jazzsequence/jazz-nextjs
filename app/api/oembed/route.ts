import { NextResponse } from 'next/server'

/**
 * GET /api/oembed?url=<external-article-url>
 *
 * Server-side proxy that returns article metadata in oEmbed-compatible format.
 *
 * Strategy (in order):
 *   1. WordPress oEmbed — <domain>/wp-json/oembed/1.0/embed?url=<url>
 *      Works for any WordPress site (WebDevStudios, HumanMade, etc.)
 *   2. Open Graph metadata — fetch the page HTML and extract og:title,
 *      og:description, og:image, og:site_name.
 *      Works for any site (Drupal/Pantheon.io, old WordPress without oEmbed, etc.)
 *   3. 502 if both fail.
 */

/** Extract a single OG meta property value from HTML source. */
function getOgMeta(html: string, property: string): string | undefined {
  // Both attribute orderings: property="..." content="..." and content="..." property="..."
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'Missing required query param: url' },
      { status: 400 }
    )
  }

  // ── Internal /posts/[slug] URLs: fetch featured image from WordPress REST API ─
  // The Pantheon group interceptor rewrites jazzsequence.com date-based URLs to
  // /posts/[slug]. Fetch the WordPress post by slug to get its featured image.
  if (url.startsWith('/posts/')) {
    const slug = url.replace(/^\/posts\//, '').replace(/\/$/, '')
    const wpApiBase = process.env.WORDPRESS_API_URL ?? 'https://jazzsequence.com/wp-json/wp/v2'
    try {
      const res = await fetch(
        `${wpApiBase}/posts?slug=${encodeURIComponent(slug)}&_embed=true`,
        { next: { revalidate: 3600 } }
      )
      if (res.ok) {
        const posts = await res.json() as Array<{
          title?: { rendered?: string }
          excerpt?: { rendered?: string }
          _embedded?: { 'wp:featuredmedia'?: Array<{ source_url?: string }> }
        }>
        const post = posts[0]
        if (post) {
          const thumbnail_url = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
          const title = post.title?.rendered
          const description = post.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim()
          return NextResponse.json({ version: '1.0', type: 'link', title, description, thumbnail_url, provider_name: 'jazzsequence.com', provider_url: '/' })
        }
      }
    } catch { /* fall through to 502 */ }
    return NextResponse.json({ error: 'Internal post not found' }, { status: 502 })
  }

  let origin: string
  try {
    origin = new URL(url).origin
  } catch {
    return NextResponse.json({ error: 'Invalid url param' }, { status: 400 })
  }

  const ua = { 'User-Agent': 'jazzsequence.com/1.0' }
  const cacheOpts = { next: { revalidate: 86400 } } // cache 24h

  // ── Step 1: Try WordPress oEmbed ──────────────────────────────────────────
  const oEmbedEndpoint =
    `${origin}/wp-json/oembed/1.0/embed?url=${encodeURIComponent(url)}&format=json`

  let oEmbedData: Record<string, unknown> | null = null
  try {
    const res = await fetch(oEmbedEndpoint, { headers: ua, ...cacheOpts })
    if (res.ok) {
      oEmbedData = await res.json() as Record<string, unknown>
      // If the oEmbed response includes a thumbnail, we're done
      if (oEmbedData?.thumbnail_url) {
        return NextResponse.json(oEmbedData)
      }
      // oEmbed succeeded but no thumbnail — fall through to augment with OG image
    }
    // oEmbed not available — fall through to OG meta
  } catch {
    // Network error — fall through to OG meta
  }

  // ── Step 2: Fallback to Open Graph metadata ───────────────────────────────
  try {
    const pageRes = await fetch(url, { headers: ua, ...cacheOpts })
    if (!pageRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch page for OG meta' }, { status: 502 })
    }

    const html = await pageRes.text()
    const ogTitle = getOgMeta(html, 'og:title')
    const ogDescription = getOgMeta(html, 'og:description')
    const ogImage = getOgMeta(html, 'og:image')
    const ogSiteName = getOgMeta(html, 'og:site_name')

    // If we have oEmbed data (but no thumbnail), merge it with the OG image
    if (oEmbedData) {
      return NextResponse.json({ ...oEmbedData, thumbnail_url: ogImage })
    }

    if (!ogTitle) {
      // No usable meta found at all
      return NextResponse.json({ error: 'No oEmbed or OG metadata available' }, { status: 502 })
    }

    return NextResponse.json({
      version: '1.0',
      type: 'link',
      title: ogTitle,
      description: ogDescription,
      thumbnail_url: ogImage,
      provider_name: ogSiteName,
      provider_url: origin,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch OG metadata' },
      { status: 502 }
    )
  }
}
