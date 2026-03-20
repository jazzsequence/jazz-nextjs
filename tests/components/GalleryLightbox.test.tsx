import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GalleryLightbox from '@/components/GalleryLightbox'
import type { GalleryImage } from '@/components/GalleryLightbox'

const oneImage: GalleryImage[] = [
  { src: '/thumb1.jpg', full: '/full1.jpg', alt: 'Image one' },
]

const multipleImages: GalleryImage[] = [
  { src: '/thumb1.jpg', full: '/full1.jpg', alt: 'Image one' },
  { src: '/thumb2.jpg', full: '/full2.jpg', alt: 'Image two' },
  { src: '/thumb3.jpg', full: '/full3.jpg', alt: 'Image three' },
]

describe('GalleryLightbox', () => {
  describe('thumbnail grid', () => {
    it('renders a thumbnail for each image', () => {
      render(<GalleryLightbox images={multipleImages} />)
      const buttons = screen.getAllByRole('listitem')
      expect(buttons).toHaveLength(3)
    })

    it('renders thumbnail images with correct src and alt', () => {
      render(<GalleryLightbox images={oneImage} />)
      const img = screen.getByAltText('Image one')
      expect(img).toHaveAttribute('src', '/thumb1.jpg')
    })

    it('uses accessible label when alt is empty', () => {
      render(<GalleryLightbox images={[{ src: '/t.jpg', full: '/f.jpg', alt: '' }]} />)
      const button = screen.getByRole('listitem')
      expect(button).toHaveAttribute('aria-label', 'Image 1 of 1 — click to enlarge')
    })
  })

  describe('lightbox interaction', () => {
    it('lightbox is not shown before clicking', () => {
      render(<GalleryLightbox images={oneImage} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('clicking a thumbnail opens the lightbox', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('lightbox shows the full-size image', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      // The dialog contains the full-size image
      const dialog = screen.getByRole('dialog')
      const img = dialog.querySelector('img')
      expect(img).toHaveAttribute('src', '/full1.jpg')
      expect(img).toHaveAttribute('alt', 'Image one')
    })

    it('close button dismisses the lightbox', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      fireEvent.click(screen.getByRole('button', { name: 'Close gallery' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('clicking the overlay background closes the lightbox', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      fireEvent.click(screen.getByRole('dialog'))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('Escape key closes the lightbox', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('single image — no navigation', () => {
    it('does not show prev/next buttons for a single image', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      expect(screen.queryByRole('button', { name: 'Previous image' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next image' })).not.toBeInTheDocument()
    })

    it('does not show the counter for a single image', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      expect(screen.queryByText(/1 \/ 1/)).not.toBeInTheDocument()
    })
  })

  describe('multiple images — navigation', () => {
    it('shows prev and next buttons', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[0])
      expect(screen.getByRole('button', { name: 'Previous image' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next image' })).toBeInTheDocument()
    })

    it('shows the correct counter', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[0])
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('clicking Next advances to the next image', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[0])
      fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
      const dialog = screen.getByRole('dialog')
      expect(dialog.querySelector('img')).toHaveAttribute('src', '/full2.jpg')
    })

    it('clicking Prev goes to the previous image', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[1]) // open on image 2
      fireEvent.click(screen.getByRole('button', { name: 'Previous image' }))
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('wraps from last to first with Next', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[2]) // open on image 3
      fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('wraps from first to last with Prev', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[0]) // open on image 1
      fireEvent.click(screen.getByRole('button', { name: 'Previous image' }))
      expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })

    it('ArrowRight key advances to next image', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[0])
      fireEvent.keyDown(window, { key: 'ArrowRight' })
      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })

    it('ArrowLeft key goes to previous image', () => {
      render(<GalleryLightbox images={multipleImages} />)
      fireEvent.click(screen.getAllByRole('listitem')[1])
      fireEvent.keyDown(window, { key: 'ArrowLeft' })
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  describe('captions', () => {
    it('renders caption when provided', () => {
      const withCaption: GalleryImage[] = [
        { src: '/t.jpg', full: '/f.jpg', alt: 'Alt text', caption: 'A beautiful sunset' },
      ]
      render(<GalleryLightbox images={withCaption} />)
      fireEvent.click(screen.getByRole('listitem'))
      expect(screen.getByText('A beautiful sunset')).toBeInTheDocument()
    })

    it('does not render caption when not provided', () => {
      render(<GalleryLightbox images={oneImage} />)
      fireEvent.click(screen.getByRole('listitem'))
      // No caption element — just verify the dialog doesn't have unexpected text
      const dialog = screen.getByRole('dialog')
      // Counter won't be shown for single image, just the image + buttons
      expect(dialog.querySelectorAll('p')).toHaveLength(0)
    })
  })
})
