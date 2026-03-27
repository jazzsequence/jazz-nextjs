import Link from 'next/link'
import DOMPurify from 'isomorphic-dompurify'
import PostCard from './PostCard'
import type { WPPost } from '@/lib/wordpress/types'

interface SearchResultsProps {
  results: WPPost[]
  query: string
  type: string
  totalPages: number
  currentPage: number
}


const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Posts', value: 'post' },
  { label: 'Media', value: 'media' },
]

/**
 * SearchResults — server component
 *
 * Renders filtered search results with WCAG 2.1 AA accessibility requirements:
 * - Live region for result count
 * - Filter tabs nav with aria-current
 * - mark element for query term highlighting
 * - Empty state with role=status
 * - Skip link to results
 */
export default function SearchResults({
  results,
  query,
  type,
  totalPages: _totalPages,
  currentPage: _currentPage,
}: SearchResultsProps) {
  return (
    <div>
      {/* Skip link */}
      <a
        href="#search-results"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-surface focus:text-brand-cyan focus:rounded-lg focus:font-heading focus:text-sm"
      >
        Skip to results
      </a>

      {/* Result count — announced to screen readers on change */}
      <div
        role="status"
        aria-label="Search results"
        aria-live="polite"
        className="text-brand-muted text-sm mb-4"
      >
        {results.length > 0
          ? `${results.length} results for "${query}"`
          : null}
      </div>

      {/* Filter tabs */}
      <nav aria-label="Filter search results" className="mb-6">
        <ul className="flex gap-2 flex-wrap list-none p-0 m-0">
          {FILTER_TABS.map(({ label, value }) => {
            const isActive = type === value
            return (
              <li key={value}>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&type=${value}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`inline-block px-4 py-2 rounded-lg border text-sm font-heading font-medium transition-colors no-underline ${
                    isActive
                      ? 'bg-brand-cyan text-brand-bg border-brand-cyan'
                      : 'bg-brand-surface border-brand-border text-brand-text-sub hover:border-brand-cyan hover:text-brand-cyan'
                  }`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Results */}
      <section id="search-results" aria-label="Search results">
        {results.length === 0 ? (
          <div
            role="status"
            className="p-6 bg-brand-surface border border-brand-border rounded-xl text-brand-muted text-center"
          >
            No results found for &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((post, index) => (
              <SearchResultCard
                key={post.id}
                post={post}
                query={query}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pagination — rendered by parent for correct basePath */}
    </div>
  )
}
function highlightTerm(text: string, term: string): React.ReactNode[] {
  if (!term) return [text]
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-brand-cyan/20 text-brand-cyan rounded-sm px-0.5 not-italic">{part}</mark>
      : part
  )
}

/**
 * SearchResultCard — PostCard with hideExcerpt + a highlighted excerpt below.
 * Using hideExcerpt avoids showing two excerpts; the highlighted one replaces it.
 */
function SearchResultCard({
  post,
  query,
  priority = false,
}: {
  post: WPPost
  query: string
  priority?: boolean
}) {
  const rawExcerpt = post.excerpt.rendered
    ? DOMPurify.sanitize(post.excerpt.rendered, { ALLOWED_TAGS: [] }).trim()
    : ''

  return (
    <div className="relative">
      {/* Post-type badge */}
      <span className="absolute top-3 right-3 z-10 bg-brand-surface/90 border border-brand-border text-brand-cyan font-mono text-xs px-2 py-0.5 rounded-full pointer-events-none">
        {post.type}
      </span>

      {/* Pass highlighted excerpt into PostCard — replaces plain excerpt, no duplicate */}
      <PostCard
        post={post}
        priority={priority}
        excerptContent={rawExcerpt ? highlightTerm(rawExcerpt, query) : undefined}
      />
    </div>
  )
}
