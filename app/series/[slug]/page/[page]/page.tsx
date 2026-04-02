import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  fetchSeriesBySlug,
  fetchPostsWithPagination,
  fetchMenuItems,
  WPNotFoundError,
} from '@/lib/wordpress/client'
import type { WPPost } from '@/lib/wordpress/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import PostsList from '@/components/PostsList'
import Pagination from '@/components/Pagination'

export const revalidate = 3600

interface SeriesPageProps {
  params: Promise<{ slug: string; page: string }>
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug, page } = await params
  try {
    const series = await fetchSeriesBySlug(slug)
    return {
      title: `${series.name} — Page ${page} | jazzsequence`,
      description: series.description || `Posts in the ${series.name} series`,
      robots: { index: false, follow: true },
    }
  } catch {
    return { title: 'Series not found' }
  }
}

export default async function PaginatedSeriesArchivePage({ params }: SeriesPageProps) {
  const { slug, page: pageParam } = await params
  const page = parseInt(pageParam, 10)

  if (isNaN(page) || page < 2) notFound()

  let series
  try {
    series = await fetchSeriesBySlug(slug, {
      isr: { revalidate: 3600, tags: [`series-${slug}`] },
    })
  } catch (error) {
    if (error instanceof WPNotFoundError) notFound()
    throw error
  }

  const [postsResult, menuItems] = await Promise.allSettled([
    fetchPostsWithPagination<WPPost>('posts', {
      series: [series.id],
      page,
      perPage: 12,
      embed: true,
      isr: { revalidate: 3600, tags: [`series-${slug}`, 'posts'] },
    }),
    fetchMenuItems(1698, {
      isr: { revalidate: 3600, tags: ['menu', 'header'] },
    }),
  ])

  const { data: posts, totalPages } =
    postsResult.status === 'fulfilled'
      ? postsResult.value
      : { data: [], totalPages: 0 }

  if (page > totalPages && totalPages > 0) notFound()

  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-muted mb-2">Series</p>
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-2">{series.name}</h1>
        {series.description && (
          <p className="text-brand-muted mb-2">{series.description}</p>
        )}
        <p className="text-brand-muted mb-8">
          {series.count} {series.count === 1 ? 'post' : 'posts'}
        </p>

        {posts.length === 0 ? (
          <p className="text-brand-muted font-heading">No posts found.</p>
        ) : (
          <>
            <PostsList posts={posts} />
            <Pagination currentPage={page} totalPages={totalPages} basePath={`/series/${slug}`} />
          </>
        )}
      </main>

      <Footer />
    </>
  )
}
