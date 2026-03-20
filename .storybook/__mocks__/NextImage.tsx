// Storybook mock for next/image — renders a plain <img> without Next.js optimization
// This avoids the "Element type is invalid: got object" error in the Vite/Storybook context.
import React from 'react'
import type { ImageProps } from 'next/image'

type MockImageProps = Omit<ImageProps, 'src'> & { src: string }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MockImage = ({ src, alt, fill, className, sizes, priority, ...rest }: MockImageProps) => {
  const style: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    : {}

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === 'string' ? src : ''}
      alt={alt ?? ''}
      className={className}
      style={style}
      {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)}
    />
  )
}

export default MockImage
