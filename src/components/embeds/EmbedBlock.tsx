'use client'

import type { CSSProperties, ReactNode } from 'react'

interface EmbedBlockProps {
  /** WordPress oEmbed provider slug (e.g. 'youtube', 'spotify', 'reddit'). */
  provider: string
  /** Maps to WordPress is-type-* class: 'video' | 'rich' | 'photo'. */
  type: 'video' | 'rich' | 'photo'
  /**
   * Optional 16:9 or 4:3 aspect ratio. When set, adds
   * wp-embed-aspect-{ratio} and wp-has-aspect-ratio to the figure.
   */
  aspectRatio?: '16-9' | '4-3'
  /** Inline styles forwarded to the inner .wp-block-embed__wrapper div. */
  wrapperStyle?: CSSProperties
  children: ReactNode
}

/**
 * Generates the standard WordPress oEmbed figure wrapper markup:
 *
 *   figure.wp-block-embed.is-type-{type}.is-provider-{provider}.wp-block-embed-{provider}
 *     div.wp-block-embed__wrapper
 *       {children}
 *
 * Used by the Design System/Embeds Storybook stories to document each
 * WordPress core oEmbed provider's class structure. In production, WordPress
 * generates this markup and PostContent renders it via html-react-parser.
 */
export function EmbedBlock({ provider, type, aspectRatio, wrapperStyle, children }: EmbedBlockProps) {
  const classes = [
    'wp-block-embed',
    `is-type-${type}`,
    `is-provider-${provider}`,
    `wp-block-embed-${provider}`,
    ...(aspectRatio ? [`wp-embed-aspect-${aspectRatio}`, 'wp-has-aspect-ratio'] : []),
  ].join(' ')

  return (
    <figure className={classes}>
      <div className="wp-block-embed__wrapper" style={wrapperStyle}>
        {children}
      </div>
    </figure>
  )
}
