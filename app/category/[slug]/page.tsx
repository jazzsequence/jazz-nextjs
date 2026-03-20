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
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const category = await fetchCategoryBySlug(slug)
    return {
      title: `${category.name} | jazzsequence`,
      description: category.description || `Posts in the ${category.name} category`,
    }
  } catch {
    return { title: 'Category not found' }
  }
}

export default async function CategoryArchivePage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

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
