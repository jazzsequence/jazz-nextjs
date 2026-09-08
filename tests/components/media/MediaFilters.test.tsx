import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MediaFilters } from '@/components/media/MediaFilters'
import type { WPMediaType } from '@/lib/wordpress/types'

function mockType(overrides: Partial<WPMediaType> = {}): WPMediaType {
  return {
    id: 5319,
    count: 45,
    description: '',
    link: 'https://jazzsequence.com/media-type/podcast/',
    name: 'Podcast',
    slug: 'podcast',
    taxonomy: 'media_type',
    meta: {},
    ...overrides,
  }
}

const types: WPMediaType[] = [
  mockType(),
  mockType({ id: 5321, count: 11, name: 'Video', slug: 'video' }),
]

describe('MediaFilters', () => {
  it('renders a pill for every media type', () => {
    render(<MediaFilters types={types} />)

    expect(screen.getByRole('link', { name: 'Podcast' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Video' })).toBeInTheDocument()
  })

  it('links each pill to the filtered media URL', () => {
    render(<MediaFilters types={types} />)

    expect(screen.getByRole('link', { name: 'Podcast' })).toHaveAttribute(
      'href',
      '/media?type=podcast'
    )
    expect(screen.getByRole('link', { name: 'Video' })).toHaveAttribute(
      'href',
      '/media?type=video'
    )
  })

  it('renders an All pill pointing at the unfiltered listing', () => {
    render(<MediaFilters types={types} />)

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('href', '/media')
  })

  it('marks the All pill as current when no filter is active', () => {
    render(<MediaFilters types={types} />)

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Podcast' })).not.toHaveAttribute('aria-current')
  })

  it('marks the matching pill as current when a filter is active', () => {
    render(<MediaFilters types={types} activeSlug="podcast" />)

    expect(screen.getByRole('link', { name: 'Podcast' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Video' })).not.toHaveAttribute('aria-current')
  })

  it('treats an unrecognised slug as no filter', () => {
    render(<MediaFilters types={types} activeSlug="not-a-real-type" />)

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Podcast' })).not.toHaveAttribute('aria-current')
  })

  it('gives the active pill the highlighted style and the rest the muted one', () => {
    render(<MediaFilters types={types} activeSlug="podcast" />)

    expect(screen.getByRole('link', { name: 'Podcast' }).className).toContain('bg-brand-cyan')
    expect(screen.getByRole('link', { name: 'Video' }).className).toContain('bg-brand-surface-high')
  })

  it('exposes the filter group as a labelled navigation landmark', () => {
    render(<MediaFilters types={types} />)

    expect(screen.getByRole('navigation', { name: /media type/i })).toBeInTheDocument()
  })

  it('renders nothing when there are no media types', () => {
    const { container } = render(<MediaFilters types={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
