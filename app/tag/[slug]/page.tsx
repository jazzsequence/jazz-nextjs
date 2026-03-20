import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  fetchTagBySlug,
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

interface TagPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const tag = await fetchTagBySlug(slug)
    return {
      title: `Posts tagged "${tag.name}" | jazzsequence`,
      description: tag.description || `Posts tagged with ${tag.name}`,
    }
  } catch {
    return { title: 'Tag not found' }
  }
}

export default async function TagArchivePage({ params, searchParams }: TagPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  // Look up tag first — 404 if it doesn't exist
  let tag
  try {
    tag = await fetchTagBySlug(slug, {
      isr: { revalidate: 3600, tags: [`tag-${slug}`] },
    })
  } catch (error) {
    if (error instanceof WPNotFoundError) notFound()
    throw error
  }

  const [postsResult, menuItems] = await Promise.allSettled([
    fetchPostsWithPagination<WPPost>('posts', {
      tags: [tag.id],
      page,
      perPage: 10,
      embed: true,
      isr: { revalidate: 3600, tags: [`tag-${slug}`, 'posts'] },
    }),
    fetchMenuItems(1698, {
      isr: { revalidate: 3600, tags: ['menu', 'header'] },
    }),
  ])

  const { data: posts, totalPages } =
    postsResult.status === 'fulfilled'
      ? postsResult.value
      : { data: [], totalPages: 0 }

  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-2">{tag.name}</h1>
        <p className="text-brand-muted mb-8">
          {tag.count} {tag.count === 1 ? 'post' : 'posts'} tagged with &ldquo;{tag.name}&rdquo;
        </p>

        {posts.length === 0 ? (
          <p className="text-brand-muted font-heading">No posts found.</p>
        ) : (
          <>
            <PostsList posts={posts} />
            <Pagination currentPage={page} totalPages={totalPages} basePath={`/tag/${slug}`} />
          </>
        )}
      </main>

      <Footer />
    </>
  )
}
