import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPost } from '@/lib/wordpress/client'
import type { WPPage } from '@/lib/wordpress/types'
import PostContent from '@/components/PostContent'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { fetchMenuItems } from '@/lib/wordpress/client'

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

  let page: WPPage
  try {
    page = await fetchPost<WPPage>('pages', slug, {
      isr: { revalidate: 3600 }, // Revalidate every hour
      embed: true,
    })
  } catch {
    notFound()
  }

  // Fetch navigation menu
  const menuItems = await fetchMenuItems(1698, {
    isr: { revalidate: 3600 },
  }).catch(() => [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation menuItems={menuItems} />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-4xl font-bold mb-6">{page.title.rendered}</h1>

          <PostContent post={page} />
        </article>
      </main>

      <Footer />
    </div>
  )
}
