import type { Metadata } from 'next'
import {
  fetchPostsWithPagination,
  fetchMenuItems,
  fetchPost,
  fetchMediaTypes,
} from '@/lib/wordpress/client'
import type { WPMedia, WPMediaType, WPPage } from '@/lib/wordpress/types'
import { resolveMediaEmbed } from '@/lib/utils/media'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Pagination from '@/components/Pagination'
import { MediaFilters } from '@/components/media/MediaFilters'
import Link from 'next/link'
import { decodeHtmlEntities } from '@/lib/utils/html'

export const revalidate = 3600

const PER_PAGE = 12

const MEDIA_TYPE_ISR = { revalidate: 3600, tags: ['media-type'] }

interface MediaPageProps {
  searchParams: Promise<{ type?: string; page?: string }>
}

/**
 * The media_type terms, or an empty list if the taxonomy request fails.
 *
 * Failing soft is deliberate: no terms means no pills and an unfiltered listing,
 * which is the page as it existed before filtering — the same degradation the menu
 * and intro-page fetches already use.
 */
function fetchMediaTypesOrNone(): Promise<WPMediaType[]> {
  return fetchMediaTypes({ isr: MEDIA_TYPE_ISR }).catch(() => [])
}

/** Resolve a `?type=` slug to its term, or undefined when it names no known term. */
function findType(types: WPMediaType[], slug?: string): WPMediaType | undefined {
  return slug ? types.find((type) => type.slug === slug) : undefined
}

export async function generateMetadata({ searchParams }: MediaPageProps): Promise<Metadata> {
  const { type } = await searchParams
  const activeType = type ? findType(await fetchMediaTypesOrNone(), type) : undefined

  if (!activeType) {
    return {
      title: 'Media',
      description: 'Videos, talks, and podcast appearances by Chris Reynolds.',
      alternates: { canonical: '/media' },
    }
  }

  // A filtered view is a subset of /media, not a second copy of it. The canonical is
  // self-referencing so it never claims to *be* /media, and it is kept out of the index
  // — same treatment as /media/page/N — so the facets don't compete with the collection
  // they filter. `follow` keeps the items themselves reachable through the pills.
  return {
    title: `Media — ${activeType.name}`,
    description: `${activeType.name} appearances by Chris Reynolds.`,
    alternates: { canonical: `/media?type=${activeType.slug}` },
    robots: { index: false, follow: true },
  }
}

function MediaCard({ item }: { item: WPMedia }) {
  const thumbnail = item._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const source = item.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim()
  const title = decodeHtmlEntities(item.title.rendered)
  const embed = item.media_url ? resolveMediaEmbed(item.media_url) : null
  const isExternal = embed?.type === 'external'

  const cardContent = (
    <>
      {thumbnail && (
        <div className="relative aspect-video overflow-hidden bg-brand-surface-high">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-brand-bg/80 rounded-full p-3">
              {isExternal ? (
                <svg className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-brand-cyan" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <h2 className="font-heading font-bold text-brand-text text-base leading-snug mb-1 group-hover:text-brand-cyan transition-colors line-clamp-2">
          {title}
        </h2>
        {source && (
          <p className="font-mono text-xs text-brand-muted uppercase tracking-widest">
            {source}
          </p>
        )}
      </div>
    </>
  )

  const cardClass = "neon-border-hover-subtle group no-underline block bg-brand-surface border border-brand-border rounded-xl overflow-hidden transition-colors"

  if (isExternal && embed?.originalUrl) {
    return (
      <a
        href={embed.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {cardContent}
      </a>
    )
  }

  return (
    <Link href={`/media/${item.slug}`} className={cardClass}>
      {cardContent}
    </Link>
  )
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
  const params = await searchParams
  const typeSlug = params.type?.trim() || undefined
  const page = Number(params.page) || 1

  // Started before anything awaits it, so an unfiltered request never pays for the
  // round trip: only a filtered one has to wait, and only because the REST endpoint
  // takes term IDs (?media-type=podcast returns 400) so the slug must be resolved first.
  const typesPromise = fetchMediaTypesOrNone()
  const activeType = typeSlug ? findType(await typesPromise, typeSlug) : undefined

  const [mediaResult, menuItems, videosPageResult] = await Promise.allSettled([
    fetchPostsWithPagination<WPMedia>('media', {
      embed: true,
      perPage: PER_PAGE,
      page,
      ...(activeType && { mediaTypes: [activeType.id] }),
      isr: { revalidate: 3600, tags: ['media'] },
    }),
    fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
    fetchPost<WPPage>('pages', 'videos', { embed: true, isr: { revalidate: 3600, tags: ['pages'] } }),
  ])

  const mediaTypes = await typesPromise

  const { data: items, totalPages } = mediaResult.status === 'fulfilled'
    ? mediaResult.value
    : { data: [], totalPages: 0 }
  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined
  const videosPage = videosPageResult.status === 'fulfilled' ? videosPageResult.value : null
  const heroImage = videosPage?._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const heroAlt = videosPage?._embedded?.['wp:featuredmedia']?.[0]?.alt_text ?? ''
  const introHtml = videosPage?.content?.rendered ?? ''

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {heroImage && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={heroImage}
            alt={heroAlt}
            className="w-full max-h-64 object-cover rounded-xl mb-8"
          />
        )}
        <h1 className="font-heading text-3xl font-bold text-brand-text mb-2">Media</h1>
        {introHtml ? (
          <div
            className="text-brand-muted mb-8 prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        ) : (
          <p className="text-brand-muted mb-8">Videos, talks, and podcast appearances.</p>
        )}

        <MediaFilters types={mediaTypes} activeSlug={typeSlug} />

        {items.length > 0 ? (
          <>
            <div
              data-testid="media-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {items.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              basePath={activeType ? `/media?type=${activeType.slug}` : '/media'}
            />
          </>
        ) : (
          <p className="text-brand-muted">No media items found.</p>
        )}
      </main>
      <Footer />
    </>
  )
}
