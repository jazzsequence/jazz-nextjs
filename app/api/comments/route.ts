import { NextRequest, NextResponse } from 'next/server'
import { fetchComments } from '@/lib/wordpress/comments'

const WP_API_URL = process.env.WORDPRESS_API_URL ?? 'https://jazzsequence.com/wp-json/wp/v2'
const WP_COMMENTS_URL = `${WP_API_URL}/comments`

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postIdRaw = searchParams.get('postId')

  if (!postIdRaw) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const postId = Number(postIdRaw)
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: 'postId must be a positive integer' }, { status: 400 })
  }

  try {
    const comments = await fetchComments(postId)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('[comments] error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 502 })
  }
}

export async function POST(request: NextRequest) {
  let body: {
    post?: number
    author_name?: string
    author_email?: string
    content?: string
    website?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { post, author_name, author_email, content, website } = body

  // Honeypot: real users never fill this hidden field.
  if (website) {
    return NextResponse.json({ success: true })
  }

  if (!post || typeof post !== 'number') {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
  }
  if (!author_name || typeof author_name !== 'string' || !author_name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!author_email || typeof author_email !== 'string' || !author_email.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!isValidEmail(author_email.trim())) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
  }

  try {
    const res = await fetch(WP_COMMENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post,
        author_name: author_name.trim(),
        author_email: author_email.trim(),
        content: content.trim(),
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      return NextResponse.json(
        { error: err.message ?? 'Failed to post comment' },
        { status: res.status }
      )
    }

    const comment = await res.json()
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('[comments] WordPress unreachable:', error)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 502 })
  }
}
