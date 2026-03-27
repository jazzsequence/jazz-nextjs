import { MetadataRoute } from 'next'
import { fetchPostsWithPagination } from '@/lib/wordpress/client'
import type { WPPost } from '@/lib/wordpress/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jazzsequence.com'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
  { url: `${BASE_URL}/posts`, changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE_URL}/games`, changeFrequency: 'weekly', priority: 0.7 },
  { url: `${BASE_URL}/media`, changeFrequency: 'weekly', priority: 0.7 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data: posts } = await fetchPostsWithPagination<WPPost>('posts', { perPage: 100 })

    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${BASE_URL}/posts/${post.slug}`,
      lastModified: new Date(post.modified),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    return [...STATIC_ROUTES, ...postRoutes]
  } catch {
    // Return static routes only if WordPress is unreachable
    return STATIC_ROUTES
  }
}
