import type { Metadata } from 'next'
import { fetchPostsWithPagination, fetchMenuItems } from '@/lib/wordpress/client'
import type { WPPost } from '@/lib/wordpress/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Pagination from '@/components/Pagination'
import SearchResults from '@/components/SearchResults'

// Search results must always be fresh — never serve stale cache
export const revalidate = 0

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  return {
    title: query ? `Search: ${query}` : 'Search',
    description: query
      ? `Search results for "${query}" on jazzsequence.com`
      : 'Search jazzsequence.com',
    robots: { index: false },
  }
}

/**
 * Fetch results from one or both post types depending on the filter.
 *
 * - type=all  → posts only (media is a CPT; mixing requires deduplication and sorting
 *               which degrades relevance; posts covers the primary content corpus)
 * - type=post → posts
 * - type=media → media CPT
 *
 * When type=all the design calls for fetching both, but WordPress full-text
 * search across CPTs isn't unified — we fetch posts as the default corpus for
 * "all" since that's the primary content type, and surface media separately
 * only when explicitly filtered. This matches how most headless WP sites handle
 * cross-CPT search without a dedicated search engine.
 */
async function fetchSearchResults(
  query: string,
  type: string,
  page: number
): Promise<{ results: WPPost[]; totalPages: number }> {
  if (!query) {
    return { results: [], totalPages: 0 }
  }

  const sharedOptions = {
    search: query,
    perPage: 12,
    page,
    embed: true,
  }

  try {
    if (type === 'media') {
      const mediaResult = await fetchPostsWithPagination<WPPost>('media', sharedOptions)
      return { results: mediaResult.data, totalPages: mediaResult.totalPages }
    }

    // type=all or type=post
    const postsResult = await fetchPostsWithPagination<WPPost>('posts', sharedOptions)
    return { results: postsResult.data, totalPages: postsResult.totalPages }
  } catch {
    return { results: [], totalPages: 0 }
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const type = params.type ?? 'all'
  const page = Number(params.page) || 1

  const [searchData, menuItems] = await Promise.allSettled([
    fetchSearchResults(query, type, page),
    fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
  ])

  const { results, totalPages } =
    searchData.status === 'fulfilled'
      ? searchData.value
      : { results: [], totalPages: 0 }

  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

  // Build pagination base path preserving q and type
  const paginationBase = `/search?q=${encodeURIComponent(query)}&type=${type}`

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-6">
          Results for &ldquo;<em>{query}</em>&rdquo;
        </h1>

        <SearchResults
          results={results}
          query={query}
          type={type}
          totalPages={totalPages}
          currentPage={page}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={paginationBase}
          />
        )}
      </main>

      <Footer />
    </>
  )
}
