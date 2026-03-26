/**
 * ArticleCardWithImage — renders ArticleCard immediately with provided props,
 * then fetches og:image asynchronously to populate the hero image.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import ArticleCardWithImage from '@/components/ArticleCardWithImage'

const baseProps = {
  href: 'https://pantheon.io/blog/why-wordpress-multisite',
  title: 'Why WordPress Multisite',
  sourceName: 'Pantheon',
  sourceUrl: 'https://pantheon.io',
}

describe('ArticleCardWithImage', () => {
  it('renders the title immediately without waiting for the image fetch', () => {
    server.use(
      http.get('/api/oembed', () => new Promise(() => {})) // never resolves
    )
    render(<ArticleCardWithImage {...baseProps} />)
    // Title should be visible immediately
    expect(screen.getByText('Why WordPress Multisite')).toBeInTheDocument()
  })

  it('shows the og:image as hero once fetched', async () => {
    server.use(
      http.get('/api/oembed', () =>
        HttpResponse.json({ thumbnail_url: 'https://pantheon.io/blog-thumb.jpg' })
      )
    )
    const { container } = render(<ArticleCardWithImage {...baseProps} />)
    await waitFor(() => {
      const hero = container.querySelector('[data-testid="article-hero"]')
      expect(hero).toBeInTheDocument()
    })
  })

  it('renders without hero image when fetch fails', async () => {
    server.use(
      http.get('/api/oembed', () => HttpResponse.json({ error: 'fail' }, { status: 502 }))
    )
    const { container } = render(<ArticleCardWithImage {...baseProps} />)
    // Give time for the fetch to fail
    await new Promise(r => setTimeout(r, 50))
    expect(container.querySelector('[data-testid="article-hero"]')).not.toBeInTheDocument()
  })

  it('fetches OG image for internal /posts/[slug] hrefs via /api/oembed', async () => {
    server.use(
      http.get('/api/oembed', () =>
        HttpResponse.json({ thumbnail_url: 'https://example.com/wp59-thumb.jpg' })
      )
    )
    const { container } = render(
      <ArticleCardWithImage
        {...baseProps}
        href="/posts/wordpress-5-9-full-site-editing-is-here"
      />
    )
    await waitFor(() => {
      const hero = container.querySelector('[data-testid="article-hero"]')
      expect(hero).toBeInTheDocument()
    })
  })

  it('uses imageUrl prop directly without fetching', async () => {
    let fetchCalled = false
    server.use(
      http.get('/api/oembed', () => {
        fetchCalled = true
        return HttpResponse.json({})
      })
    )
    const { container } = render(
      <ArticleCardWithImage {...baseProps} imageUrl="https://cdn.example.com/pre-loaded.jpg" />
    )
    await new Promise(r => setTimeout(r, 50))
    expect(fetchCalled).toBe(false)
    const hero = container.querySelector('[data-testid="article-hero"]')
    expect(hero).toBeInTheDocument()
  })
})
