'use client'

import { useState, FormEvent } from 'react'
import type { WPComment } from '@/lib/wordpress/types'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

interface CommentSectionProps {
  postId: number
  initialComments?: WPComment[]
  /** Override form state — used in Storybook */
  initialState?: FormState
  /** Override error message — used with initialState='error' in Storybook */
  initialError?: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function AuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name.trim().charAt(0).toUpperCase()
  if (avatarUrl && !avatarUrl.includes('gravatar.com/avatar/00000000')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} width={40} height={40} className="rounded-full w-10 h-10" />
  }
  return (
    <div className="w-10 h-10 rounded-full bg-brand-surface-high border border-brand-border flex items-center justify-center flex-shrink-0">
      <span className="text-brand-cyan font-heading font-bold text-sm">{initials}</span>
    </div>
  )
}

interface CommentNode extends WPComment {
  replies: CommentNode[]
}

function buildCommentTree(comments: WPComment[]): CommentNode[] {
  const map = new Map<number, CommentNode>()
  const roots: CommentNode[] = []

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] })
  }
  for (const node of map.values()) {
    if (node.parent === 0) {
      roots.push(node)
    } else {
      map.get(node.parent)?.replies.push(node)
    }
  }
  return roots
}

function CommentItem({ comment, depth = 0 }: { comment: CommentNode; depth?: number }) {
  return (
    <div>
      <article className="flex gap-4">
        <AuthorAvatar
          name={comment.author_name}
          avatarUrl={comment.author_avatar_urls['48']}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
            <span className="font-heading font-semibold text-brand-cyan text-sm">
              {comment.author_name}
            </span>
            <time dateTime={comment.date_gmt} className="text-xs text-brand-muted">
              {formatDate(comment.date)}
            </time>
          </div>
          <div
            className="text-brand-text text-sm leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0 [&_a]:text-brand-cyan [&_a:hover]:underline"
            dangerouslySetInnerHTML={{ __html: comment.content.rendered }}
          />
        </div>
      </article>

      {comment.replies.length > 0 && (
        <div className={`mt-6 space-y-6 ${
          depth === 0 ? 'ml-14 pl-6 border-l border-brand-border' :
          depth === 1 ? 'ml-10 pl-5 border-l border-brand-border' :
          depth === 2 ? 'ml-6 pl-4 border-l border-brand-border-bright' :
          'ml-4 pl-3 border-l border-brand-border-bright'
        }`}>
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function CommentForm({
  postId,
  initialState = 'idle',
  initialError = '',
}: {
  postId: number
  initialState?: FormState
  initialError?: string
}) {
  const [state, setState] = useState<FormState>(initialState)
  const [errorMessage, setErrorMessage] = useState(initialError)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('submitting')
    setErrorMessage('')

    const form = e.currentTarget
    const data = {
      post: postId,
      author_name: (form.elements.namedItem('author_name') as HTMLInputElement).value,
      author_email: (form.elements.namedItem('author_email') as HTMLInputElement).value,
      content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
      website: (form.elements.namedItem('website') as HTMLInputElement).value,
    }

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setState('success')
      } else {
        const body = await res.json().catch(() => ({}))
        setErrorMessage(body.error ?? 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-surface p-6 text-center">
        <p className="font-heading text-lg text-brand-cyan mb-1">Comment submitted!</p>
        <p className="text-brand-muted text-sm">Your comment is awaiting moderation.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
    <div className="w-3/4 mx-auto space-y-5">
      <h3 className="font-heading text-xl text-brand-text">Leave a Reply</h3>
      {/* Honeypot */}
      <div aria-hidden="true" style={{ display: 'none' }}>
        <label htmlFor="comment-website">Website</label>
        <input id="comment-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state === 'error' && (
        <div role="alert" className="rounded-lg border border-brand-magenta bg-brand-surface p-4 text-brand-magenta text-sm">
          {errorMessage}
        </div>
      )}

      <p className="text-xs text-brand-muted">
        Fields marked <span className="text-brand-magenta" aria-hidden="true">*</span>
        {' '}<span className="sr-only">with an asterisk</span> are required.
        Your email address will not be published.
      </p>

      <div>
        <label htmlFor="comment-name" className="block text-sm font-medium text-brand-text mb-1">
          Name <span className="text-brand-magenta" aria-hidden="true">*</span>
        </label>
        <input
          id="comment-name"
          name="author_name"
          type="text"
          required
          autoComplete="name"
          disabled={state === 'submitting'}
          className="w-full rounded-lg border border-brand-border bg-brand-surface-high px-4 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="comment-email" className="block text-sm font-medium text-brand-text mb-1">
          Email <span className="text-brand-magenta" aria-hidden="true">*</span>
        </label>
        <input
          id="comment-email"
          name="author_email"
          type="email"
          required
          autoComplete="email"
          disabled={state === 'submitting'}
          className="w-full rounded-lg border border-brand-border bg-brand-surface-high px-4 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-50"
        />
      </div>

      <div>
        <label htmlFor="comment-content" className="block text-sm font-medium text-brand-text mb-1">
          Comment <span className="text-brand-magenta" aria-hidden="true">*</span>
        </label>
        <textarea
          id="comment-content"
          name="content"
          required
          rows={5}
          disabled={state === 'submitting'}
          className="w-full rounded-lg border border-brand-border bg-brand-surface-high px-4 py-2 text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-cyan disabled:opacity-50 resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full rounded-lg bg-brand-cyan px-6 py-3 font-heading font-bold text-brand-bg transition-colors hover:bg-brand-magenta disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? 'Posting…' : 'Post Comment'}
      </button>
    </div>
    </form>
  )
}

export default function CommentSection({
  postId,
  initialComments = [],
  initialState,
  initialError,
}: CommentSectionProps) {
  const count = initialComments.length

  return (
    <section aria-labelledby="comments-heading" className="mt-12 border-t border-brand-border pt-10 space-y-10">
      <div>
        <h2 id="comments-heading" className="font-heading text-2xl text-brand-text mb-6">
          {count === 0 ? 'No comments yet' : count === 1 ? '1 Comment' : `${count} Comments`}
        </h2>

        {count > 0 && (
          <div className="space-y-8">
            {buildCommentTree(initialComments).map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>

      <CommentForm postId={postId} initialState={initialState} initialError={initialError} />
    </section>
  )
}
