import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPost, fetchMenuItems, WPNotFoundError } from '@/lib/wordpress/client'
import type { WPPage } from '@/lib/wordpress/types'
import { decodeHtmlEntities } from '@/lib/utils/html'
import PostContent from '@/components/PostContent'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
export const revalidate = 3600 // ISR: Revalidate every hour

interface PageProps {
  params: Promise<{ slug: string; child: string }>
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
      title: decodeHtmlEntities(page.title.rendered),
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
 *
 * Note: WordPress handles parent-child relationships internally.
 * We fetch by child slug only - WordPress knows the hierarchy.
 */
export default async function ChildPage({ params }: PageProps) {
  const { child } = await params

  // Fetch page data by child slug
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
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-brand-magenta font-heading">Unable to load page. Please try again later.</p>
          <p className="text-brand-muted text-sm mt-2 font-heading">
            Error: {(error as Error)?.message || 'Unknown error'}
          </p>
        </main>
        <Footer />
      </>
    )
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PostContent post={pageData} />
      </main>

      <Footer />
    </>
  )
}
