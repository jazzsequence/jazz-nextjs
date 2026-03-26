import { Metadata } from 'next'
import { notFound, forbidden } from 'next/navigation'
import { fetchPost, fetchMenuItems, WPNotFoundError, WPForbiddenError } from '@/lib/wordpress/client'
import type { WPPage } from '@/lib/wordpress/types'
import { decodeHtmlEntities } from '@/lib/utils/html'
import PostContent from '@/components/PostContent'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export const revalidate = 3600

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof WPNotFoundError ||
    (error as Error)?.name === 'WPNotFoundError' ||
    (error as Error)?.constructor?.name === 'WPNotFoundError' ||
    ((error as { statusCode?: number })?.statusCode === 404)
  )
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const page = await fetchPost<WPPage>('pages', slug, {
      isr: { revalidate: 3600 },
    })

    return {
      title: decodeHtmlEntities(page.title.rendered),
      description: page.excerpt?.rendered
        ? page.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160)
        : undefined,
    }
  } catch {
    return { title: 'Page Not Found' }
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params

  let pageData: WPPage
  try {
    pageData = await fetchPost<WPPage>('pages', slug, {
      isr: { revalidate: 3600, tags: ['pages', `page-${slug}`] },
      embed: true,
    })
  } catch (error) {
    console.error('[Page Fetch Error]', {
      slug,
      errorName: (error as Error)?.name,
      errorMessage: (error as Error)?.message,
      isWPNotFoundError: error instanceof WPNotFoundError,
    })

    if (error instanceof WPForbiddenError) forbidden()

    if (isNotFoundError(error)) notFound()

    const [menuItems] = await Promise.allSettled([
      fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
    ])

    const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
    const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

    return (
      <>
        <Navigation menuItems={menuItemsData} error={menuError} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-brand-magenta font-heading">
            Unable to load page. Please try again later.
          </p>
        </main>
        <Footer />
      </>
    )
  }

  const [menuItems] = await Promise.allSettled([
    fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
  ])

  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

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
