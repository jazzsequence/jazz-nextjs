import { NextResponse } from 'next/server'

/**
 * GET /api/oembed?url=<external-article-url>
 *
 * Server-side proxy for WordPress oEmbed endpoints. Fetches oEmbed JSON from
 * the external WordPress site, avoiding CORS issues in the browser.
 *
 * WordPress sites expose oEmbed at: <domain>/wp-json/oembed/1.0/embed?url=<url>
 * The response includes: title, description, provider_name, provider_url,
 * thumbnail_url, and more — all we need to render an ArticleCard.
 */
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

  const oEmbedEndpoint = `${origin}/wp-json/oembed/1.0/embed?url=${encodeURIComponent(url)}&format=json`

  try {
    const res = await fetch(oEmbedEndpoint, {
      headers: { 'User-Agent': 'jazzsequence.com/1.0' },
      next: { revalidate: 86400 }, // cache for 24h — oEmbed data rarely changes
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `oEmbed endpoint returned ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch oEmbed data' },
      { status: 502 }
    )
  }
}
