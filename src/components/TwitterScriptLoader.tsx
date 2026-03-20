'use client'

/**
 * Loads the Twitter/X widget script client-side so that
 * `<blockquote class="twitter-tweet">` elements are enhanced
 * into embedded tweets.
 *
 * Safe to render multiple times — checks for an existing script tag
 * and calls widgets.load() if the script is already present.
 */
import { useEffect } from 'react'

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load?: () => void
      }
    }
  }
}

export default function TwitterScriptLoader() {
  useEffect(() => {
    if (window.twttr?.widgets?.load) {
      window.twttr.widgets.load()
      return
    }
    if (document.querySelector('script[src*="platform.twitter.com"]')) return
    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.charset = 'utf-8'
    document.head.appendChild(script)
  }, [])

  return null
}
