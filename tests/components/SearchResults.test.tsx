import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchResults from '@/components/SearchResults'
import type { WPPost } from '@/lib/wordpress/types'

// PostCard uses next/image and next/link — mock both
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} src={String(props.src)} />
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

function makePost(overrides: Partial<WPPost> = {}): WPPost {
  return {
    id: 1,
    type: 'post',
    title: { rendered: 'Test Post' },
    excerpt: { rendered: '<p>This is an excerpt about jazz music</p>' },
    content: { rendered: '<p>Full content</p>' },
    date: '2024-01-01T00:00:00',
    date_gmt: '2024-01-01T00:00:00',
    modified: '2024-01-01T00:00:00',
    modified_gmt: '2024-01-01T00:00:00',
    slug: 'test-post',
    status: 'publish',
    link: 'https://jazzsequence.com/test-post',
    author: 1,
    featured_media: 0,
    comment_status: 'open',
    ping_status: 'open',
    sticky: false,
    template: '',
    format: 'standard',
    meta: {},
    categories: [],
    tags: [],
    ...overrides,
  }
}

const defaultProps = {
  results: [] as WPPost[],
  query: 'jazz',
  type: 'all',
  totalPages: 1,
  currentPage: 1,
}

describe('SearchResults', () => {
  describe('empty state', () => {
    it('shows empty state with role=status when no results', () => {
      render(<SearchResults {...defaultProps} results={[]} />)
      // There can be multiple role=status elements (live region + empty state)
      const statusEls = screen.getAllByRole('status')
      const emptyEl = statusEls.find((el) => /no results found for/i.test(el.textContent ?? ''))
      expect(emptyEl).toBeInTheDocument()
      expect(emptyEl).toHaveTextContent('jazz')
    })

    it('includes the query term in the empty state message', () => {
      render(<SearchResults {...defaultProps} results={[]} query="NextJS" />)
      const statusEls = screen.getAllByRole('status')
      const emptyEl = statusEls.find((el) => /no results found for/i.test(el.textContent ?? ''))
      expect(emptyEl).toHaveTextContent('NextJS')
    })
  })

  describe('result cards', () => {
    it('renders a card for each result', () => {
      const results = [
        makePost({ id: 1, title: { rendered: 'Post Alpha' }, slug: 'post-alpha' }),
        makePost({ id: 2, title: { rendered: 'Post Beta' }, slug: 'post-beta' }),
        makePost({ id: 3, title: { rendered: 'Post Gamma' }, slug: 'post-gamma' }),
      ]
      render(<SearchResults {...defaultProps} results={results} />)
      expect(screen.getByText('Post Alpha')).toBeInTheDocument()
      expect(screen.getByText('Post Beta')).toBeInTheDocument()
      expect(screen.getByText('Post Gamma')).toBeInTheDocument()
    })

    it('renders a type badge for each result', () => {
      const results = [makePost({ id: 1, type: 'post' })]
      render(<SearchResults {...defaultProps} results={results} />)
      expect(screen.getByText('post')).toBeInTheDocument()
    })
  })

  describe('query term highlighting', () => {
    it('highlights the query term with a brand-styled mark element inside the card excerpt', () => {
      const results = [
        makePost({
          id: 1,
          excerpt: { rendered: '<p>This is an excerpt about jazz music and jazz festivals</p>' },
        }),
      ]
      const { container } = render(
        <SearchResults {...defaultProps} results={results} query="jazz" />
      )
      const marks = container.querySelectorAll('mark')
      expect(marks.length).toBeGreaterThan(0)
      marks.forEach((mark) => {
        expect(mark.textContent?.toLowerCase()).toBe('jazz')
        // Brand-styled: cyan highlight, not browser default yellow
        expect(mark.className).toContain('text-brand-cyan')
      })
    })

    it('does not render a separate excerpt paragraph below the card (no duplication)', () => {
      const results = [
        makePost({
          id: 1,
          excerpt: { rendered: '<p>This is an excerpt about jazz music</p>' },
        }),
      ]
      const { container } = render(
        <SearchResults {...defaultProps} results={results} query="jazz" />
      )
      // The aria-label approach was the old separate <p> — should not exist
      const separateExcerpts = container.querySelectorAll('[aria-label^="Excerpt for"]')
      expect(separateExcerpts.length).toBe(0)
    })

    it('does not highlight when query is empty', () => {
      const results = [makePost({ id: 1 })]
      const { container } = render(
        <SearchResults {...defaultProps} results={results} query="" />
      )
      expect(container.querySelectorAll('mark').length).toBe(0)
    })
  })

  describe('filter tabs', () => {
    it('renders filter tabs nav with accessible label', () => {
      render(<SearchResults {...defaultProps} results={[makePost()]} />)
      const nav = screen.getByRole('navigation', { name: /filter search results/i })
      expect(nav).toBeInTheDocument()
    })

    it('sets aria-current on the active tab', () => {
      render(<SearchResults {...defaultProps} results={[makePost()]} type="all" />)
      const allTab = screen.getByRole('link', { name: /all/i })
      expect(allTab).toHaveAttribute('aria-current', 'true')
    })

    it('does not set aria-current on inactive tabs', () => {
      render(<SearchResults {...defaultProps} results={[makePost()]} type="all" />)
      const postsTab = screen.getByRole('link', { name: /^posts$/i })
      expect(postsTab).not.toHaveAttribute('aria-current', 'true')
    })

    it('filter tab links include the query param', () => {
      render(<SearchResults {...defaultProps} results={[makePost()]} query="wordpress" />)
      const postsTab = screen.getByRole('link', { name: /^posts$/i })
      expect(postsTab.getAttribute('href')).toContain('q=wordpress')
      expect(postsTab.getAttribute('href')).toContain('type=post')
    })
  })

  describe('result count announcement', () => {
    it('announces the result count via aria-live region', () => {
      const results = [makePost(), makePost({ id: 2, slug: 'post-2' })]
      render(<SearchResults {...defaultProps} results={results} />)
      const liveRegion = screen.getByRole('status', { name: /search results/i })
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      expect(liveRegion).toHaveTextContent('2')
    })
  })

  describe('skip link', () => {
    it('renders a skip link to the results section', () => {
      render(<SearchResults {...defaultProps} results={[makePost()]} />)
      const skipLink = screen.getByText(/skip to results/i)
      expect(skipLink).toBeInTheDocument()
      expect(skipLink.closest('a')).toHaveAttribute('href', '#search-results')
    })
  })
})
