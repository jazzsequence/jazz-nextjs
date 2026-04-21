import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import CommentSection from '@/components/CommentSection'
import type { WPComment } from '@/lib/wordpress/types'

beforeEach(() => {
  vi.clearAllMocks()
})

const avatar = {
  '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24',
  '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48',
  '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96',
}

function makeComment(overrides: Partial<WPComment> & { id: number }): WPComment {
  return {
    post: 42,
    parent: 0,
    author: 0,
    author_name: 'Alice',
    author_url: '',
    date: '2026-01-01T10:00:00',
    date_gmt: '2026-01-01T10:00:00',
    content: { rendered: '<p>A comment.</p>' },
    link: 'https://jazzsequence.com/post/#comment-1',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: avatar,
    ...overrides,
  }
}

// ── Comment count heading ──────────────────────────────────────────────────────

describe('CommentSection — comment count', () => {
  it('shows "No comments yet" when there are no comments', () => {
    render(<CommentSection postId={42} initialComments={[]} />)
    expect(screen.getByRole('heading', { name: /no comments yet/i })).toBeInTheDocument()
  })

  it('shows "1 Comment" for a single comment', () => {
    render(<CommentSection postId={42} initialComments={[makeComment({ id: 1 })]} />)
    expect(screen.getByRole('heading', { name: /1 comment/i })).toBeInTheDocument()
  })

  it('shows plural "N Comments" for multiple comments', () => {
    render(<CommentSection postId={42} initialComments={[
      makeComment({ id: 1 }),
      makeComment({ id: 2, author_name: 'Bob' }),
    ]} />)
    expect(screen.getByRole('heading', { name: /2 comments/i })).toBeInTheDocument()
  })
})

// ── Comment list rendering ─────────────────────────────────────────────────────

describe('CommentSection — comment display', () => {
  it('renders each comment author name', () => {
    render(<CommentSection postId={42} initialComments={[
      makeComment({ id: 1, author_name: 'Alice' }),
      makeComment({ id: 2, author_name: 'Bob' }),
    ]} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders comment content HTML', () => {
    render(<CommentSection postId={42} initialComments={[
      makeComment({ id: 1, content: { rendered: '<p>Hello world</p>' } }),
    ]} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders a formatted date for each comment', () => {
    render(<CommentSection postId={42} initialComments={[
      makeComment({ id: 1, date: '2026-03-15T14:22:00' }),
    ]} />)
    expect(screen.getByText(/march 15, 2026/i)).toBeInTheDocument()
  })

  it('renders initials avatar when gravatar URL is blank', () => {
    render(<CommentSection postId={42} initialComments={[
      makeComment({ id: 1, author_name: 'Alice' }),
    ]} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})

// ── Comment threading ──────────────────────────────────────────────────────────

describe('CommentSection — threading', () => {
  it('renders a reply nested under its parent', () => {
    const comments = [
      makeComment({ id: 1, author_name: 'Alice', parent: 0 }),
      makeComment({ id: 2, author_name: 'Bob', parent: 1 }),
    ]
    render(<CommentSection postId={42} initialComments={comments} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('renders deeply nested replies', () => {
    const comments = [
      makeComment({ id: 1, author_name: 'L0', parent: 0 }),
      makeComment({ id: 2, author_name: 'L1', parent: 1 }),
      makeComment({ id: 3, author_name: 'L2', parent: 2 }),
      makeComment({ id: 4, author_name: 'L3', parent: 3 }),
    ]
    render(<CommentSection postId={42} initialComments={comments} />)
    expect(screen.getByText('L0')).toBeInTheDocument()
    expect(screen.getByText('L1')).toBeInTheDocument()
    expect(screen.getByText('L2')).toBeInTheDocument()
    expect(screen.getByText('L3')).toBeInTheDocument()
  })

  it('orphaned comments (unknown parent) are not rendered', () => {
    const comments = [
      makeComment({ id: 1, author_name: 'Root', parent: 0 }),
      makeComment({ id: 2, author_name: 'Orphan', parent: 999 }),
    ]
    render(<CommentSection postId={42} initialComments={comments} />)
    expect(screen.getByText('Root')).toBeInTheDocument()
    expect(screen.queryByText('Orphan')).not.toBeInTheDocument()
  })
})

// ── Form rendering ─────────────────────────────────────────────────────────────

describe('CommentSection — form fields', () => {
  it('renders name, email, and comment fields', () => {
    render(<CommentSection postId={42} />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /comment/i })).toBeInTheDocument()
  })

  it('renders a submit button', () => {
    render(<CommentSection postId={42} />)
    expect(screen.getByRole('button', { name: /post comment/i })).toBeInTheDocument()
  })

  it('all fields are required', () => {
    render(<CommentSection postId={42} />)
    expect(screen.getByLabelText(/name/i)).toBeRequired()
    expect(screen.getByLabelText(/email/i)).toBeRequired()
    expect(screen.getByRole('textbox', { name: /comment/i })).toBeRequired()
  })

  it('email field has type=email', () => {
    render(<CommentSection postId={42} />)
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email')
  })

  it('renders "Leave a Reply" heading inside the form area', () => {
    render(<CommentSection postId={42} />)
    expect(screen.getByRole('heading', { name: /leave a reply/i })).toBeInTheDocument()
  })
})

// ── Form states ────────────────────────────────────────────────────────────────

describe('CommentSection — form states', () => {
  it('initialState=submitting disables the submit button', () => {
    render(<CommentSection postId={42} initialState="submitting" />)
    expect(screen.getByRole('button', { name: /posting/i })).toBeDisabled()
  })

  it('initialState=success shows moderation notice and hides the form', () => {
    render(<CommentSection postId={42} initialState="success" />)
    expect(screen.getByText(/awaiting moderation/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument()
  })

  it('initialState=error shows error alert', () => {
    render(<CommentSection postId={42} initialState="error" initialError="Something broke." />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/something broke/i)).toBeInTheDocument()
  })
})

// ── Form submission ────────────────────────────────────────────────────────────

describe('CommentSection — form submission', () => {
  it('disables button while submitting', async () => {
    server.use(http.post('/api/comments', () => new Promise(() => {})))

    render(<CommentSection postId={42} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /comment/i }), { target: { value: 'Hello!' } })
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }))

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
  })

  it('shows moderation notice on successful submission', async () => {
    server.use(http.post('/api/comments', () => HttpResponse.json({ id: 1, status: 'hold' }, { status: 201 })))

    render(<CommentSection postId={42} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /comment/i }), { target: { value: 'Hello!' } })
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }))

    await waitFor(() => expect(screen.getByText(/awaiting moderation/i)).toBeInTheDocument())
  })

  it('shows error alert on failed submission', async () => {
    server.use(http.post('/api/comments', () => HttpResponse.json({ error: 'Closed' }, { status: 403 })))

    render(<CommentSection postId={42} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /comment/i }), { target: { value: 'Hello!' } })
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('posts correct fields to /api/comments', async () => {
    let body: Record<string, unknown> = {}
    server.use(http.post('/api/comments', async ({ request }) => {
      body = await request.json() as Record<string, unknown>
      return HttpResponse.json({ id: 1 }, { status: 201 })
    }))

    render(<CommentSection postId={42} />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: /comment/i }), { target: { value: 'Great post!' } })
    fireEvent.click(screen.getByRole('button', { name: /post comment/i }))

    await waitFor(() => {
      expect(body).toMatchObject({
        post: 42,
        author_name: 'Alice',
        author_email: 'alice@example.com',
        content: 'Great post!',
      })
    })
  })
})

// ── Accessibility ──────────────────────────────────────────────────────────────

describe('CommentSection — accessibility', () => {
  it('section has aria-labelledby pointing to the comments heading', () => {
    render(<CommentSection postId={42} />)
    const section = screen.getByRole('region', { name: /comments/i })
    expect(section).toBeInTheDocument()
  })
})
