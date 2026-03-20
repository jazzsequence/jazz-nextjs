'use client'

import { useState, useCallback, useEffect } from 'react'

export interface GalleryImage {
  src: string
  full: string
  alt: string
  caption?: string
}

export default function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const close = useCallback(() => setActiveIndex(null), [])
  const prev = useCallback(() => {
    setActiveIndex(i => i !== null ? (i - 1 + images.length) % images.length : null)
  }, [images.length])
  const next = useCallback(() => {
    setActiveIndex(i => i !== null ? (i + 1) % images.length : null)
  }, [images.length])

  useEffect(() => {
    if (activeIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [activeIndex, close, prev, next])

  return (
    <>
      {/* Thumbnail grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-8"
        role="list"
        aria-label="Image gallery"
      >
        {images.map((img, i) => (
          <button
            key={`gallery-${i}`}
            role="listitem"
            onClick={() => setActiveIndex(i)}
            className="relative aspect-square overflow-hidden rounded-lg group cursor-zoom-in bg-brand-surface border border-brand-border"
            aria-label={img.alt || `Image ${i + 1} of ${images.length} — click to enlarge`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Gallery image ${activeIndex + 1} of ${images.length}`}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
            onClick={close}
            aria-label="Close gallery"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Full-size image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeIndex].full}
            alt={images[activeIndex].alt}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Caption */}
          {images[activeIndex].caption && (
            <p
              className="absolute bottom-12 left-0 right-0 text-center text-white/80 text-sm font-heading px-4"
              onClick={e => e.stopPropagation()}
            >
              {images[activeIndex].caption}
            </p>
          )}

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 transition-colors"
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 text-center text-white/60 font-mono text-xs">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
