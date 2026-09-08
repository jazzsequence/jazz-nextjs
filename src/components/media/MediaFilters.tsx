import Link from 'next/link'
import type { WPMediaType } from '@/lib/wordpress/types'

interface MediaFiltersProps {
  types: WPMediaType[]
  /** Slug of the active media type, if any. An unrecognised slug reads as "no filter". */
  activeSlug?: string
}

// Same pill language as GamesGrid, minus the `type="button"` state: filter state lives
// in the URL here, so these are anchors and the whole component stays server-rendered.
const PILL_BASE =
  'neon-border-hover no-underline rounded-full px-4 py-1.5 text-sm font-medium transition'
const PILL_ACTIVE = 'bg-brand-cyan text-brand-bg'
const PILL_INACTIVE =
  'bg-brand-surface-high text-brand-text-sub border border-brand-border hover:text-brand-cyan'

function pillClass(isActive: boolean): string {
  return `${PILL_BASE} ${isActive ? PILL_ACTIVE : PILL_INACTIVE}`
}

export function MediaFilters({ types, activeSlug }: MediaFiltersProps) {
  // No terms means no filtering is possible — render nothing rather than a lone "All".
  if (types.length === 0) return null

  const activeType = types.find((type) => type.slug === activeSlug)

  return (
    <nav
      aria-label="Filter by media type"
      data-testid="media-filters"
      className="mb-6 flex flex-wrap items-center gap-3"
    >
      <Link
        href="/media"
        aria-current={activeType ? undefined : 'page'}
        className={pillClass(!activeType)}
      >
        All
      </Link>

      {types.map((type) => (
        <Link
          key={type.id}
          href={`/media?type=${type.slug}`}
          aria-current={activeType?.id === type.id ? 'page' : undefined}
          className={pillClass(activeType?.id === type.id)}
        >
          {type.name}
        </Link>
      ))}
    </nav>
  )
}
