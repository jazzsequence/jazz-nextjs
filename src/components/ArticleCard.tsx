'use client'

import { useState } from 'react'

/**
 * ArticleCard — article embed card matching the WordPressPost Storybook design.
 *
 * Used for both native WordPress post embeds (is-type-wp-embed) and Pantheon
 * custom Gutenberg groups on the /articles page. Renders consistently across
 * all external article link types.
 *
 * 'use client' is required for onError handling on the favicon image.
 */

export interface ArticleCardProps {
  /** URL of the embedded article */
  href: string
  /** Article title */
  title: string
  /** Optional excerpt / description */
  excerpt?: string
  /** Optional hero/thumbnail image URL */
  imageUrl?: string
  /** Alt text for hero image */
  imageAlt?: string
  /** Small favicon/avatar URL for the source site */
  faviconUrl?: string
  /** Display name of the source site (e.g. "WebDevStudios") */
  sourceName: string
  /** URL of the source site (e.g. "https://webdevstudios.com") */
  sourceUrl: string
}

export default function ArticleCard({
  href,
  title,
  excerpt,
  imageUrl,
  imageAlt = '',
  faviconUrl,
  sourceName,
  sourceUrl,
}: ArticleCardProps) {
  const [faviconErrored, setFaviconErrored] = useState(false)

  const cardStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '600px',
    margin: '0 auto 1rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    fontFamily: 'var(--font-heading)',
    color: 'var(--color-text)',
  }

  return (
    // Outer article — no nested <a> issues; content and source are separate links.
    <article style={cardStyle}>
      {imageUrl && (
        <a
          data-testid="article-hero"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'block', height: '180px', overflow: 'hidden', textDecoration: 'none' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt}
            style={{ width: '100%', height: '100%', objectFit: 'cover', margin: 0, borderRadius: 0 }}
          />
        </a>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', padding: '0.875rem 1rem 0.875rem', textDecoration: 'none' }}
      >
        <h3
          style={{
            color: 'var(--color-text)',
            fontSize: '1rem',
            fontWeight: 700,
            margin: '0 0 0.4rem',
            lineHeight: 1.35,
            textAlign: 'left',
          }}
        >
          {title}
        </h3>

        {excerpt && (
          <p
            data-testid="article-excerpt"
            style={{
              color: 'var(--color-text-sub)',
              fontSize: '0.8125rem',
              margin: 0,
              lineHeight: 1.5,
              textAlign: 'left',
            }}
          >
            {excerpt}
          </p>
        )}
      </a>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderTop: '1px solid var(--color-border)',
          padding: '0.625rem 1rem 1rem',
        }}
      >
        {faviconUrl && !faviconErrored && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconUrl}
            alt=""
            // Use inline style for dimensions — .post-body img { height: auto } would
            // override HTML width/height attributes (CSS beats HTML attributes in specificity).
            // Inline styles beat CSS, so these are honoured.
            style={{
              flexShrink: 0,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              objectFit: 'cover',
              margin: 0,
              display: 'block',
            }}
            onError={() => setFaviconErrored(true)}
          />
        )}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--color-muted)',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.02em',
            textDecoration: 'none',
          }}
        >
          {sourceName}
        </a>
      </div>
    </article>
  )
}
