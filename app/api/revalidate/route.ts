import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-demand revalidation webhook endpoint for WordPress content updates
 *
 * WordPress can call this endpoint when content is updated to trigger
 * ISR revalidation without waiting for the revalidation interval.
 *
 * Usage:
 *   POST /api/revalidate
 *   Headers: X-Revalidate-Secret: <REVALIDATE_SECRET>
 *   Body: { path: "/posts/my-post", tag: "posts" }
 *
 * WordPress webhook URL:
 *   https://<site>.pantheonsite.io/api/revalidate
 *
 * Environment variables:
 *   REVALIDATE_SECRET - Secret token for webhook authentication
 */

export async function POST(request: NextRequest) {
  // Verify secret token
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { path, tag } = body

    // Revalidate by path or tag
    if (path) {
      await revalidatePath(path)
      console.log(`Revalidated path: ${path}`)
    }

    if (tag) {
      revalidateTag(tag, {}) // Empty config = immediate revalidation
      console.log(`Revalidated tag: ${tag}`)
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      path,
      tag,
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
