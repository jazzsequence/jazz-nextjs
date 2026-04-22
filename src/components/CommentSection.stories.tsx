import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React from 'react'
import CommentSection from '@/components/CommentSection'
import type { WPComment } from '@/lib/wordpress/types'

/**
 * CommentSection — displays approved comments and a reply form for single posts.
 *
 * Comments are fetched from the WordPress REST API (`/wp/v2/comments?post=<id>&status=approved`)
 * and submitted to `/api/comments` (a Next.js proxy route).
 *
 * States: idle → submitting (button disabled) → success (pending moderation notice) / error (alert + retry)
 *
 * `initialState` and `initialComments` are Storybook-only props for rendering
 * specific states without needing a live API.
 */

const MOCK_COMMENTS: WPComment[] = [
  {
    id: 1,
    post: 42,
    parent: 0,
    author: 0,
    author_name: 'Alice Wonderland',
    author_url: '',
    date: '2026-03-15T14:22:00',
    date_gmt: '2026-03-15T14:22:00',
    content: { rendered: '<p>Great post! Really enjoyed reading this. The section on API design was especially clear.</p>' },
    link: 'https://jazzsequence.com/post/#comment-1',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
  {
    id: 2,
    post: 42,
    parent: 0,
    author: 0,
    author_name: 'Bob Marley',
    author_url: 'https://example.com',
    date: '2026-03-16T09:05:00',
    date_gmt: '2026-03-16T09:05:00',
    content: { rendered: '<p>I had a similar experience when I tried this approach. One thing I noticed is that it works even better when you combine it with proper caching headers — definitely worth exploring.</p>' },
    link: 'https://jazzsequence.com/post/#comment-2',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
  {
    id: 3,
    post: 42,
    parent: 1,
    author: 0,
    author_name: 'Bob Marley',
    author_url: 'https://example.com',
    date: '2026-03-16T09:05:00',
    date_gmt: '2026-03-16T09:05:00',
    content: { rendered: '<p>Totally agree — the caching headers part tripped me up at first too. Once you understand how ISR interacts with the CDN layer it clicks into place.</p>' },
    link: 'https://jazzsequence.com/post/#comment-3',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
  {
    id: 4,
    post: 42,
    parent: 1,
    author: 2,
    author_name: 'Chris Reynolds',
    author_url: 'https://jazzsequence.com',
    date: '2026-03-16T11:30:00',
    date_gmt: '2026-03-16T11:30:00',
    content: { rendered: '<p>Thanks! Bob, that\'s a great point — I\'ll write a follow-up on caching specifically.</p>' },
    link: 'https://jazzsequence.com/post/#comment-4',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
  {
    id: 6,
    post: 42,
    parent: 3,
    author: 0,
    author_name: 'Alice Wonderland',
    author_url: '',
    date: '2026-03-16T14:00:00',
    date_gmt: '2026-03-16T14:00:00',
    content: { rendered: '<p>Ha, yes — the ISR + CDN interaction was what got me too. Glad it\'s clicking!</p>' },
    link: 'https://jazzsequence.com/post/#comment-6',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
  {
    id: 7,
    post: 42,
    parent: 6,
    author: 0,
    author_name: 'Bob Marley',
    author_url: '',
    date: '2026-03-16T15:10:00',
    date_gmt: '2026-03-16T15:10:00',
    content: { rendered: '<p>Agreed — once the mental model is there it all makes sense. Great discussion!</p>' },
    link: 'https://jazzsequence.com/post/#comment-7',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
  {
    id: 8,
    post: 42,
    parent: 7,
    author: 2,
    author_name: 'Chris Reynolds',
    author_url: 'https://jazzsequence.com',
    date: '2026-03-16T16:00:00',
    date_gmt: '2026-03-16T16:00:00',
    content: { rendered: '<p>+1, thanks everyone. This is exactly the kind of feedback I was hoping for.</p>' },
    link: 'https://jazzsequence.com/post/#comment-8',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
  {
    id: 5,
    post: 42,
    parent: 0,
    author: 0,
    author_name: 'Dana Scully',
    author_url: '',
    date: '2026-03-17T08:00:00',
    date_gmt: '2026-03-17T08:00:00',
    content: { rendered: '<p>Bookmarked this — exactly what I needed for a project I\'m working on. Looking forward to that caching follow-up!</p>' },
    link: 'https://jazzsequence.com/post/#comment-5',
    status: 'approved',
    type: 'comment',
    author_avatar_urls: {
      '24': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=24&d=mp',
      '48': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=48&d=mp',
      '96': 'https://gravatar.com/avatar/00000000000000000000000000000000?s=96&d=mp',
    },
  },
]

const meta: Meta<typeof CommentSection> = {
  title: 'Design System/CommentSection',
  component: CommentSection,
  decorators: [
    (Story) => (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component: 'Comment section rendered at the bottom of single post pages. Fetches approved comments from the WordPress REST API and submits new comments to `/api/comments`.',
      },
    },
  },
  args: {
    postId: 42,
    authorId: 2,
  },
}

export default meta
type Story = StoryObj<typeof CommentSection>

/** No comments yet — first-time view of a post with commenting enabled. */
export const Empty: Story = {
  args: {
    initialComments: [],
  },
}

/** With comments — the typical reading state. */
export const WithComments: Story = {
  args: {
    initialComments: MOCK_COMMENTS,
  },
}

/** Single comment — edge case with exactly one comment. */
export const SingleComment: Story = {
  args: {
    initialComments: [MOCK_COMMENTS[0]],
  },
}

/** Submitting — form is disabled while the POST is in flight. */
export const Submitting: Story = {
  args: {
    initialComments: MOCK_COMMENTS,
    initialState: 'submitting',
  },
}

/** Success — comment posted, awaiting moderation notice shown. */
export const Success: Story = {
  args: {
    initialComments: MOCK_COMMENTS,
    initialState: 'success',
  },
}

/** Error — something went wrong, retry is available. */
export const Error: Story = {
  args: {
    initialComments: MOCK_COMMENTS,
    initialState: 'error',
    initialError: 'Something went wrong. Please try again.',
  },
}

/**
 * PostWithComments — shows the comment section in context below a representative
 * post layout, matching the actual post page structure (max-w-5xl, nav, title,
 * featured image, body content, then comments).
 */
export const PostWithComments: Story = {
  args: {
    initialComments: MOCK_COMMENTS,
  },
  decorators: [
    (Story) => (
      <div className="bg-brand-bg min-h-screen">
        {/* Nav placeholder */}
        <header className="sticky top-0 z-50 bg-[#0a0a18] border-b border-brand-border h-14 flex items-center px-6">
          <span className="font-mono font-bold text-brand-cyan text-lg tracking-tight">jazzsequence</span>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured image placeholder */}
          <div className="w-full h-64 rounded-xl mb-8 overflow-hidden bg-gradient-to-br from-[#2d0b4e] via-[#0b2d4e] to-[#1a0d2e] relative">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(42,42,74,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,42,74,0.3) 1px, transparent 1px)',
              backgroundSize: '2rem 2rem',
            }} />
          </div>

          {/* Post header */}
          <p className="text-xs text-brand-muted font-heading uppercase tracking-widest mb-3">
            March 15, 2026 · 6 min read
          </p>
          <h1 className="font-heading text-4xl font-bold text-brand-text mb-4">
            Building a headless WordPress frontend with Next.js
          </h1>
          <p className="text-brand-muted text-sm mb-8">
            By <span className="text-brand-cyan">Chris Reynolds</span>
          </p>

          {/* Post body */}
          <div className="post-body space-y-4 text-brand-text leading-relaxed mb-6">
            <p>
              When I set out to rebuild jazzsequence.com as a headless WordPress site, I knew the core challenge would be maintaining content flexibility while gaining full control over the frontend. After several months of iteration, the stack has settled into something I&apos;m genuinely happy with.
            </p>
            <p>
              The architecture leans heavily on Next.js ISR — each post page is regenerated at most once per hour, with cache tags that allow on-demand invalidation when content changes in WordPress. This means the site stays fast without ever going fully stale.
            </p>
            <h2 className="font-mono text-2xl font-bold text-brand-text mt-8 mb-2">The API layer</h2>
            <p>
              Rather than calling the WordPress REST API directly from components, everything goes through a typed client layer in <code className="bg-brand-surface-high text-brand-cyan px-1.5 py-0.5 rounded text-sm font-mono">src/lib/wordpress/client.ts</code>. This keeps components clean and makes mocking straightforward in tests.
            </p>
            <p>
              One thing worth noting: the <code className="bg-brand-surface-high text-brand-cyan px-1.5 py-0.5 rounded text-sm font-mono">post_type + post_slug</code> revalidation endpoint makes a WordPress API call to resolve the slug before revalidating — which means it needs a longer timeout than other routes. Learned that the hard way.
            </p>
          </div>

          {/* Comment section */}
          <Story />
        </main>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
}
