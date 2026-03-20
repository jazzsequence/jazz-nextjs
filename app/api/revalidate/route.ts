import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-demand revalidation webhook endpoint for WordPress content updates.
 *
 * Accepts two payload formats (both require X-Revalidate-Secret header):
 *
 * 1. Explicit path/tag (generic):
 *    { "path": "/posts/my-post", "tag": "posts" }
 *
 * 2. WordPress-native (auto-computes paths and tags from post type):
 *    { "post_type": "post", "post_slug": "my-post", "action": "publish" }
 *
 * post_type → path/tag mapping:
 *   post     → /posts/<slug>        tags: posts, post-<slug>
 *   page     → /<slug>              tags: pages, page-<slug>
 *   gc_game  → /games               tags: games, game-<slug>
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
        paths: [`/posts/${post_slug}`],
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
    default:
      return { paths: [], tags: [] }
  }
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { path, tag, tags: tagsArray, post_type, post_slug } = body

    // Resolve targets from WordPress-native payload if provided
    const derived = post_type && post_slug
      ? resolveTargets(post_type as string, post_slug as string)
      : { paths: [], tags: [] }

    // Combine explicit + derived paths/tags (deduplicated)
    // Accepts both tag (single string) and tags (array of strings)
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
