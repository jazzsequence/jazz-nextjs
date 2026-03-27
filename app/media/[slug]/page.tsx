import { fetchPost, fetchMenuItems, WPNotFoundError, WPForbiddenError } from '@/lib/wordpress/client'
import type { WPMedia } from '@/lib/wordpress/types'
import { resolveMediaEmbed } from '@/lib/utils/media'
import { decodeHtmlEntities } from '@/lib/utils/html'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { notFound, forbidden } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 3600

interface MediaItemPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: MediaItemPageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const item = await fetchPost<WPMedia>('media', slug, {
      embed: true,
      isr: { revalidate: 3600, tags: ['media'] },
    })
    const title = decodeHtmlEntities(item.title.rendered)
    const description = item.excerpt?.rendered
      ? item.excerpt.rendered.replace(/<[^>]+>/g, '').trim().slice(0, 160)
      : undefined
    const thumbnail = item._embedded?.['wp:featuredmedia']?.[0]?.source_url

    return {
      title,
      description,
      alternates: { canonical: `/media/${slug}` },
      openGraph: {
        type: 'video.other',
        title,
        description,
        url: `/media/${slug}`,
        images: thumbnail ? [{ url: thumbnail }] : [],
      },
    }
  } catch {
    return { title: 'Media Not Found' }
  }
}

export default async function MediaItemPage({ params }: MediaItemPageProps) {
  const { slug } = await params

  let item: WPMedia
  try {
    item = await fetchPost<WPMedia>('media', slug, {
      isr: { revalidate: 3600, tags: ['media', `media-${slug}`] },
      embed: true,
    })
  } catch (error) {
    if (error instanceof WPForbiddenError) forbidden()
    else if (error instanceof WPNotFoundError) notFound()
    else throw error
    return null as never
  }

  const [menuItems] = await Promise.allSettled([
    fetchMenuItems(1698, { isr: { revalidate: 3600, tags: ['menu', 'header'] } }),
  ])
  const menuItemsData = menuItems.status === 'fulfilled' ? menuItems.value : undefined
  const menuError = menuItems.status === 'rejected' ? 'Failed to fetch menu items' : undefined

  const mediaUrl = item.media_url ?? ''
  const embed = mediaUrl ? resolveMediaEmbed(mediaUrl) : null
  const thumbnail = item._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const source = item.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim()
  const title = decodeHtmlEntities(item.title.rendered)

  return (
    <>
      <Navigation menuItems={menuItemsData} error={menuError} />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-heading text-3xl font-bold text-brand-text mb-2">{title}</h1>
        {source && (
          <p className="font-mono text-xs text-brand-muted uppercase tracking-widest mb-8">
            {source}
          </p>
        )}

        {embed && embed.type !== 'external' && embed.embedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-brand-surface-high mb-8">
            <iframe
              src={embed.embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : embed && embed.type === 'external' ? (
          <div className="mb-8">
            {thumbnail && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-brand-surface-high mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
              </div>
            )}
            <a
              href={embed.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-cyan text-brand-bg font-heading font-bold px-6 py-3 rounded-lg hover:bg-brand-cyan/90 transition-colors"
            >
              Watch/Listen
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
