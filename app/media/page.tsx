import { fetchPosts, fetchMenuItems } from '@/lib/wordpress/client'
import type { WPMedia } from '@/lib/wordpress/types'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { decodeHtmlEntities } from '@/lib/utils/html'

export const revalidate = 3600

export const metadata = {
  title: 'Media | jazzsequence',
  description: 'Videos, talks, and podcast appearances by Chris Reynolds.',
}

function MediaCard({ item }: { item: WPMedia }) {
  const thumbnail = item._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const source = item.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim()

  return (
    <Link
      href={`/media/${item.slug}`}
      className="group block bg-brand-surface border border-brand-border rounded-xl overflow-hidden hover:border-brand-cyan transition-colors"
    >
      {thumbnail && (
        <div className="relative aspect-video overflow-hidden bg-brand-surface-high">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-brand-bg/80 rounded-full p-3">
              <svg className="w-8 h-8 text-brand-cyan" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <h2 className="font-heading font-bold text-brand-text text-base leading-snug mb-1 group-hover:text-brand-cyan transition-colors line-clamp-2">
          {decodeHtmlEntities(item.title.rendered)}
        </h2>
        {source && (
          <p className="font-mono text-xs text-brand-muted uppercase tracking-widest">
            {source}
          </p>
        )}
      </div>
    </Link>
  )
}

export default async function MediaPage(_props: Record<string, unknown>) {
  const [mediaItems, menuItems] = await Promise.allSettled([
    fetchPosts<WPMedia>('media', {
      embed: true,
      perPage: 60,
      isr: { revalidate: 3600, tags: ['media'] },
    }),
    fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
  ])

  const items = mediaItems.status === 'fulfilled' ? mediaItems.value : []
  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text mb-2">Media</h1>
        <p className="text-brand-muted mb-8">
          Videos, talks, and podcast appearances — {items.length} items.
        </p>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-brand-muted">No media items found.</p>
        )}
      </main>
      <Footer />
    </>
  )
}
