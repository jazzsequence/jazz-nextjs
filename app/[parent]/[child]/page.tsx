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
  params: Promise<{ parent: string; child: string }>
}

/**
 * Check if error is a WordPress 404 Not Found error
 */
function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof WPNotFoundError ||
    (error as Error)?.name === 'WPNotFoundError' ||
    (error as Error)?.constructor?.name === 'WPNotFoundError' ||
    ((error as { statusCode?: number })?.statusCode === 404)
  )
}

/**
 * Generate static paths for child pages at build time
 */
export async function generateStaticParams() {
  // Return empty array - pages will be generated on-demand with ISR
  return []
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { child } = await params

  try {
    const page = await fetchPost<WPPage>('pages', child, {
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
 * WordPress Child Page Display
 *
 * Handles child pages with hierarchical URLs
 * Examples: /music/loafmen, /music/blind-chaos
 */
export default async function ChildPage({ params }: PageProps) {
  const { child } = await params

  // Fetch page data (simplify - don't use Promise.allSettled to isolate issue)
  let pageData: WPPage
  try {
    pageData = await fetchPost<WPPage>('pages', child, {
      isr: { revalidate: 3600, tags: ['pages', `page-${child}`] },
      embed: true,
    })
  } catch (error) {
    console.error('[Child Page Fetch Error]', {
      child,
      errorName: (error as Error)?.name,
      errorMessage: (error as Error)?.message,
      isWPNotFoundError: error instanceof WPNotFoundError,
    })

    if (isNotFoundError(error)) {
      notFound()
    }

    // Try to fetch menu for error UI
    const [menuItems] = await Promise.allSettled([
      fetchMenuItems(1698, {
        isr: { revalidate: 3600, tags: ['menu', 'header'] },
      }),
    ])

    const menuItemsData =
      menuItems.status === 'fulfilled' ? menuItems.value : undefined
    const menuError =
      menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

    // Render error UI
    return (
      <>
        <Navigation menuItems={menuItemsData} error={menuError} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-red-600">
            Unable to load page. Please try again later.
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Error: {(error as Error)?.message || 'Unknown error'}
          </p>
        </main>
        <Footer />
      </>
    )
  }

  // Fetch menu and build info after page succeeds
  const [menuItems, buildInfo] = await Promise.allSettled([
    fetchMenuItems(1698, {
      isr: { revalidate: 3600, tags: ['menu', 'header'] },
    }),
    getBuildInfo(),
  ])

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
          <h1 className="text-4xl font-bold mb-6">{pageData.title.rendered}</h1>
          <PostContent post={pageData} />
        </div>
      </main>

      <Footer />
    </>
  )
}
