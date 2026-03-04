import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPost, fetchMenuItems, WPNotFoundError } from '@/lib/wordpress/client'
import type { WPPage } from '@/lib/wordpress/types'
import PostContent from '@/components/PostContent'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getBuildInfo } from '@/lib/build-info'

export const revalidate = 3600 // ISR: Revalidate every hour

interface PageProps {
  params: Promise<{ slug: string }>
}

/**
 * Generate static paths for all WordPress pages at build time
 */
export async function generateStaticParams() {
  // Return empty array - pages will be generated on-demand with ISR
  // This prevents build-time failures if WordPress is unreachable
  return []
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const page = await fetchPost<WPPage>('pages', slug, {
      isr: { revalidate: 3600 },
    })

    return {
      title: page.title.rendered,
      description: page.excerpt?.rendered
        ? page.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160)
        : undefined,
    }
  } catch {
    return {
      title: 'Page Not Found',
    }
  }
}

/**
 * WordPress Page Display
 *
 * Handles all WordPress pages (page post type) with ISR caching
 * Examples: /music, /about, /now, etc.
 */
export default async function Page({ params }: PageProps) {
  const { slug } = await params

  try {
    // Fetch page, menu items, and build info in parallel
    const [page, menuItems, buildInfo] = await Promise.allSettled([
      fetchPost<WPPage>('pages', slug, {
        isr: { revalidate: 3600, tags: ['pages', `page-${slug}`] },
        embed: true,
      }),
      fetchMenuItems(1698, {
        isr: { revalidate: 3600, tags: ['menu', 'header'] },
      }),
      getBuildInfo(),
    ])

    if (page.status === 'rejected') {
      const error = page.reason
      if (error instanceof WPNotFoundError) {
        notFound()
      }
      throw error
    }

    const menuItemsData =
      menuItems.status === 'fulfilled' ? menuItems.value : undefined
    const menuError =
      menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

    const buildInfoData =
      buildInfo.status === 'fulfilled'
        ? buildInfo.value
        : { commitShort: 'unknown', buildTime: new Date().toISOString() }

    return (
      <>
        <Navigation menuItems={menuItemsData} error={menuError} />

        <main className="container mx-auto px-4 py-8">
          <div className="text-xs text-gray-500 mb-6 font-mono">
            Build: {new Date(buildInfoData.buildTime).toLocaleString()} • Commit: {buildInfoData.commitShort}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-4xl font-bold mb-6">{page.value.title.rendered}</h1>
            <PostContent post={page.value} />
          </div>
        </main>

        <Footer />
      </>
    )
  } catch (error) {
    if (error instanceof WPNotFoundError) {
      notFound()
    }

    const [menuItems] = await Promise.allSettled([
      fetchMenuItems(1698, {
        isr: { revalidate: 3600, tags: ['menu', 'header'] },
      }),
    ])

    const menuItemsData =
      menuItems.status === 'fulfilled' ? menuItems.value : undefined
    const menuError =
      menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

    return (
      <>
        <Navigation menuItems={menuItemsData} error={menuError} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-red-600">
            Unable to load page. Please try again later.
          </p>
        </main>
        <Footer />
      </>
    )
  }
}
