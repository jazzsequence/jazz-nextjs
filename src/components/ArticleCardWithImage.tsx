'use client'

import { useState, useEffect } from 'react'
import ArticleCard from './ArticleCard'
import type { ArticleCardProps } from './ArticleCard'

/**
 * ArticleCardWithImage — renders ArticleCard immediately using provided props,
 * then fetches only the og:image from /api/oembed to populate the hero image.
 *
 * Used for Pantheon custom Gutenberg group articles where the title, excerpt,
 * and source are extracted from the DOM (preserving the original article-specific
 * text) while the hero image is fetched from OG metadata.
 *
 * Unlike WPEmbedCard, this component never overrides title/excerpt with OG data.
 */
export default function ArticleCardWithImage(props: ArticleCardProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(props.imageUrl)

  useEffect(() => {
    // Skip fetch if image already provided
    if (props.imageUrl) return
    // Fetch for absolute external URLs AND for internal /posts/[slug] URLs.
    // The /api/oembed route handles both: external via oEmbed/OG, internal via WP REST API.
    if (!props.href.startsWith('http') && !props.href.startsWith('/posts/')) return

    fetch(`/api/oembed?url=${encodeURIComponent(props.href)}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: { thumbnail_url?: string } | null) => {
        if (data?.thumbnail_url) setImageUrl(data.thumbnail_url)
      })
      .catch(() => { /* image stays undefined — card renders without hero */ })
  }, [props.href, props.imageUrl])

  return <ArticleCard {...props} imageUrl={imageUrl} />
}
