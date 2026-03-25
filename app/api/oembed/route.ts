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

  try {
    const res = await fetch(oEmbedEndpoint, { headers: ua, ...cacheOpts })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
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
    const title = getOgMeta(html, 'og:title')
    const description = getOgMeta(html, 'og:description')
    const thumbnail_url = getOgMeta(html, 'og:image')
    const provider_name = getOgMeta(html, 'og:site_name')

    if (!title) {
      // No usable meta found
      return NextResponse.json({ error: 'No oEmbed or OG metadata available' }, { status: 502 })
    }

    return NextResponse.json({
      version: '1.0',
      type: 'link',
      title,
      description,
      thumbnail_url,
      provider_name,
      provider_url: origin,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch OG metadata' },
      { status: 502 }
    )
  }
}
