import sanitizeHtml from 'sanitize-html'
import type { WPComment } from '@/lib/wordpress/types'

const WP_API_URL = process.env.WORDPRESS_API_URL ?? 'https://jazzsequence.com/wp-json/wp/v2'

const COMMENT_ALLOWED_TAGS = [
  'p', 'br', 'blockquote', 'pre', 'code',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'a', 'abbr', 'span',
  'ul', 'ol', 'li',
  'h3', 'h4', 'h5', 'h6',
  'img', 'figure', 'figcaption',
  'hr',
]

function sanitizeComment(comment: WPComment): WPComment {
  return {
    ...comment,
    content: {
      ...comment.content,
      rendered: sanitizeHtml(comment.content.rendered, {
        allowedTags: COMMENT_ALLOWED_TAGS,
        allowedAttributes: {
          a: ['href', 'rel', 'target'],
          img: ['src', 'alt', 'width', 'height', 'loading'],
          '*': ['class'],
        },
      }),
    },
  }
}

export async function fetchComments(postId: number): Promise<WPComment[]> {
  const url = new URL(`${WP_API_URL}/comments`)
  url.searchParams.set('post', String(postId))
  url.searchParams.set('type', 'comment')
  url.searchParams.set('per_page', '100')
  url.searchParams.set('orderby', 'date')
  url.searchParams.set('order', 'asc')

  const res = await fetch(url.toString(), {
    next: { revalidate: 60, tags: [`comments-${postId}`] },
  })

  if (res.status === 404) return []
  if (!res.ok) throw new Error(`[comments] WordPress returned ${res.status}`)

  const comments: WPComment[] = await res.json()
  return comments.map(sanitizeComment)
}
