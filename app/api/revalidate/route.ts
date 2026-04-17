import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-demand revalidation webhook endpoint for WordPress content updates.
 *
 * Accepts three payload formats. All require the secret via header or body:
 *   Header: X-Revalidate-Secret: <secret>
 *   Body:   { "secret": "<secret>", ... }  (mu-plugin compat)
 *
 * 1. Explicit path/tag (generic):
 *    { "path": "/posts/my-post", "tag": "posts" }
 *
 * 2. WordPress-native (auto-computes paths and tags from post type):
 *    { "post_type": "post", "post_slug": "my-post", "action": "publish" }
 *
 * 3. Surrogate-key array (mu-plugin / Pantheon Advanced Page Cache format):
 *    { "surrogate_keys": ["post-123", "post-list", "term-5"] }
 *
 * post_type → path/tag mapping:
 *   post     → /posts/<slug>        tags: posts, post-<slug>
 *   page     → /<slug>              tags: pages, page-<slug>
 *   gc_game  → /games               tags: games, game-<slug>
 *   media    → /media/<slug>        tags: media, media-<slug>
 *   (other)  → no-op (safe)
 *
 * WordPress webhook URL:
 *   https://<site>.pantheonsite.io/api/revalidate
 *
 * Environment variables:
 *   REVALIDATE_SECRET — Secret token for webhook authentication
 */

/** Map a WordPress post_type + slug to the Next.js paths and ISR tags to revalidate. */
function resolveTargets(
  post_type: string,
  post_slug: string
): { paths: string[]; tags: string[] } {
  switch (post_type) {
    case 'post':
      return {
        // '/' is explicit so the homepage gets a direct revalidatePath() call.
        // revalidateTag('posts') alone is unreliable if the GCS tag→key mapping
        // for '/' was wiped by a prior full revalidation and never repopulated.
        paths: [`/posts/${post_slug}`, '/'],
        tags: ['posts', `post-${post_slug}`],
      }
    case 'page':
      return {
        paths: [`/${post_slug}`],
        tags: ['pages', `page-${post_slug}`],
      }
    case 'gc_game':
      return {
        paths: ['/games'],
        tags: ['games', `game-${post_slug}`],
      }
    case 'media':
      return {
        paths: [`/media/${post_slug}`],
        tags: ['media', `media-${post_slug}`],
      }
    default:
      return { paths: [], tags: [] }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, tag, tags: tagsArray, post_type, post_slug, surrogate_keys, secret: bodySecret } = body

    // Accept secret from header (preferred) or body (mu-plugin compat)
    const headerSecret = request.headers.get('x-revalidate-secret')
    const resolvedSecret = headerSecret ?? bodySecret

    if (resolvedSecret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    // Format 3: surrogate_keys array (mu-plugin / PAPC format)
    if (surrogate_keys !== undefined) {
      if (!Array.isArray(surrogate_keys) || surrogate_keys.length === 0) {
        return NextResponse.json(
          { error: 'surrogate_keys must be a non-empty array' },
          { status: 400 }
        )
      }

      const keys = surrogate_keys as string[]
      for (const t of keys) {
        revalidateTag(t, "max")
        console.log(`Revalidated surrogate key: ${t}`)
      }

      return NextResponse.json({
        success: true,
        revalidated: true,
        tags: keys,
        timestamp: new Date().toISOString(),
      })
    }

    // Format 1 + 2: explicit path/tag or WordPress-native post_type + post_slug
    const derived = post_type && post_slug
      ? resolveTargets(post_type as string, post_slug as string)
      : { paths: [], tags: [] }

    const explicitTags = [
      ...(tag ? [tag as string] : []),
      ...(Array.isArray(tagsArray) ? (tagsArray as string[]) : []),
    ]
    const allPaths = [...new Set([...(path ? [path] : []), ...derived.paths])]
    const allTags  = [...new Set([...explicitTags, ...derived.tags])]

    for (const p of allPaths) {
      await revalidatePath(p)
      console.log(`Revalidated path: ${p}`)
    }

    for (const t of allTags) {
      revalidateTag(t, "max")
      console.log(`Revalidated tag: ${t}`)
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      // Legacy fields (backward compat)
      path,
      tag,
      // New fields
      paths: allPaths,
      tags: allTags,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Support GET for testing (only in development)
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'GET method not supported in production' },
      { status: 405 }
    )
  }

  return NextResponse.json({
    message: 'Revalidation webhook endpoint',
    usage: {
      method: 'POST',
      headers: {
        'x-revalidate-secret': 'Your REVALIDATE_SECRET',
      },
      body: {
        path: '/path/to/revalidate',
        tag: 'tag-to-revalidate',
      },
    },
  })
}
