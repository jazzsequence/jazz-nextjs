'use client'

import { useState } from 'react'

interface PostBodyImageProps {
  src: string
  alt?: string
  className?: string
  width?: number
  height?: number
  title?: string
  srcSet?: string
}

/**
 * Inline image in post body content with graceful error handling.
 *
 * When an image URL is broken (hotlinked external images that have since been
 * deleted, etc.), returns null rather than showing the browser's broken image
 * icon. Intercepts all <img> elements in post body via PostContent parseOptions.
 */
export default function PostBodyImage({
  src,
  alt = '',
  className,
  width,
  height,
  title,
  srcSet,
}: PostBodyImageProps) {
  const [errored, setErrored] = useState(false)

  if (errored) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      title={title}
      srcSet={srcSet}
      onError={() => setErrored(true)}
    />
  )
}
