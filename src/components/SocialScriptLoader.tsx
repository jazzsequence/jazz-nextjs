'use client'

import { useEffect } from 'react'

/**
 * Maps a platform key to a CSS class fragment that identifies it in post content
 * and the script URL needed to render its embeds.
 *
 * These are all WordPress core oEmbed providers that inject a <script> tag
 * alongside a <blockquote>. The script is stripped by DOMPurify; this component
 * re-injects it client-side only when the relevant markup is detected.
 *
 * iframe-based providers (YouTube, Vimeo, Spotify, SoundCloud, etc.) do not
 * need script loading — their iframes render natively once DOMPurify allows them.
 */
const SOCIAL_EMBED_SCRIPTS: ReadonlyArray<{
  key: string
  selector: string
  src: string
}> = [
  {
    key: 'twitter',
    selector: 'twitter-tweet',
    src: 'https://platform.twitter.com/widgets.js',
  },
  {
    key: 'tiktok',
    selector: 'tiktok-embed',
    src: 'https://www.tiktok.com/embed.js',
  },
  {
    key: 'instagram',
    selector: 'instagram-media',
    src: 'https://www.instagram.com/embed.js',
  },
  {
    key: 'reddit',
    selector: 'reddit-embed-bq',
    src: 'https://embed.reddit.com/widgets.js',
  },
  {
    key: 'imgur',
    selector: 'imgur-embed-pub',
    src: 'https://s.imgur.com/min/embed.js',
  },
  {
    key: 'tumblr',
    selector: 'tumblr-post',
    src: 'https://assets.tumblr.com/post.js',
  },
  {
    key: 'flickr',
    selector: 'data-flickr-embed',
    src: 'https://embedr.flickr.com/assets/client-code.js',
  },
]

interface SocialScriptLoaderProps {
  /** Raw post content HTML — used to detect which platforms are present. */
  content: string
}

/**
 * Detects social embed markup in post content and lazily injects the platform
 * scripts that WordPress would normally include but DOMPurify strips.
 *
 * Only loads scripts for platforms that are actually present in the content.
 * Safe to render multiple times — deduplicates by `data-social-embed` attribute.
 *
 * Covers all WordPress core oEmbed providers that require client-side scripts:
 * Twitter/X, TikTok, Instagram, Reddit, Imgur, Tumblr, Flickr. All other core
 * providers (YouTube, Vimeo, Spotify, SoundCloud, etc.) use iframes and need
 * no script loading.
 */
export default function SocialScriptLoader({ content }: SocialScriptLoaderProps) {
  useEffect(() => {
    for (const { key, selector, src } of SOCIAL_EMBED_SCRIPTS) {
      if (!content.includes(selector)) continue
      if (document.head.querySelector(`script[data-social-embed="${key}"]`)) continue

      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.charset = 'utf-8'
      script.setAttribute('data-social-embed', key)

      try {
        document.head.appendChild(script)
      } catch {
        // happy-dom disables JS file loading in test environments — safe to ignore
      }
    }
  }, [content])

  return null
}
