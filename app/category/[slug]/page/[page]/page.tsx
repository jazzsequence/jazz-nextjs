import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  fetchCategoryBySlug,
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

interface CategoryPageProps {
  params: Promise<{ slug: string; page: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug, page } = await params
  try {
    const category = await fetchCategoryBySlug(slug)
    return {
      title: `${category.name} — Page ${page} | jazzsequence`,
      description: category.description || `Posts in the ${category.name} category`,
      robots: { index: false, follow: true },
    }
  } catch {
    return { title: 'Category not found' }
  }
}

export default async function PaginatedCategoryArchivePage({ params }: CategoryPageProps) {
  const { slug, page: pageParam } = await params
  const page = parseInt(pageParam, 10)

  if (isNaN(page) || page < 2) notFound()

  let category
  try {
    category = await fetchCategoryBySlug(slug, {
      isr: { revalidate: 3600, tags: [`category-${slug}`] },
    })
  } catch (error) {
    if (error instanceof WPNotFoundError) notFound()
    throw error
  }

  const [postsResult, menuItems] = await Promise.allSettled([
    fetchPostsWithPagination<WPPost>('posts', {
      categories: [category.id],
      page,
      perPage: 12,
      embed: true,
      isr: { revalidate: 3600, tags: [`category-${slug}`, 'posts'] },
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
        <h1 className="font-heading text-4xl font-bold text-brand-text mb-2">{category.name}</h1>
        <p className="text-brand-muted mb-8">
          {category.count} {category.count === 1 ? 'post' : 'posts'} in &ldquo;{category.name}&rdquo;
        </p>

        {posts.length === 0 ? (
          <p className="text-brand-muted font-heading">No posts found.</p>
        ) : (
          <>
            <PostsList posts={posts} />
            <Pagination currentPage={page} totalPages={totalPages} basePath={`/category/${slug}`} />
          </>
        )}
      </main>

      <Footer />
    </>
  )
}
