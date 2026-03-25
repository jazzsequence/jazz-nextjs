'use client'

import { useState, useEffect } from 'react'
import ArticleCard from './ArticleCard'

interface OEmbedData {
  title?: string
  description?: string
  provider_name?: string
  provider_url?: string
  thumbnail_url?: string
}

interface WPEmbedCardProps {
  /** The external article URL (from the is-type-wp-embed wrapper) */
  url: string
  /** Provider name from the figure class (e.g. "WebDevStudios") — used as fallback */
  providerName: string
  /** Title from the blockquote fallback content — shown while loading or on error */
  fallbackTitle: string
}

/**
 * Fetches oEmbed data for a native WordPress post embed and renders an ArticleCard.
 *
 * WordPress's is-type-wp-embed block renders a hidden iframe + a blockquote fallback.
 * In the headless context the iframe never loads (no wp-embed.min.js). This component
 * replaces that pattern by fetching oEmbed data server-side via /api/oembed and
 * rendering an ArticleCard matching the WordPressPost Storybook design.
 */
export default function WPEmbedCard({ url, providerName, fallbackTitle }: WPEmbedCardProps) {
  const [data, setData] = useState<OEmbedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/oembed?url=${encodeURIComponent(url)}`)
      .then(res => (res.ok ? res.json() : null))
      .then((json: OEmbedData | null) => {
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [url])

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Loading article embed"
        style={{
          maxWidth: '600px',
          margin: '0 auto 1rem',
          height: '80px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          opacity: 0.5,
        }}
      />
    )
  }

  const title = data?.title ?? fallbackTitle
  const excerpt = data?.description
  const sourceLabel = data?.provider_name ?? providerName
  const sourceUrl = data?.provider_url ?? (() => { try { return new URL(url).origin } catch { return url } })()
  const imageUrl = data?.thumbnail_url
  // Attempt to derive the provider favicon from their domain
  const faviconUrl = `${sourceUrl}/favicon.ico`

  return (
    <ArticleCard
      href={url}
      title={title}
      excerpt={excerpt}
      imageUrl={imageUrl}
      sourceName={sourceLabel}
      sourceUrl={sourceUrl}
      faviconUrl={faviconUrl}
    />
  )
}
