'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FeaturedImageProps {
  src: string
  alt: string
}

/**
 * Featured image for a post.
 *
 * Wraps next/image with an onError fallback: if the image URL is broken
 * (e.g. a 404 from jazzsequence.com when the file was offloaded to the CDN
 * but WP Offload Media failed to rewrite the URL), the retrowave gradient
 * placeholder is shown instead of a broken image icon.
 */
export default function FeaturedImage({ src, alt }: FeaturedImageProps) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div
        data-testid="featured-image-placeholder"
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #2d0b4e 0%, #0b2d4e 50%, #1a0d2e 100%)' }}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      priority
      sizes="(max-width: 1024px) 100vw, 1024px"
      onError={() => setErrored(true)}
    />
  )
}
