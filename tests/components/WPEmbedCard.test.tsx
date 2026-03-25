/**
 * WPEmbedCard — fetches oEmbed data for is-type-wp-embed figures and renders ArticleCard.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import WPEmbedCard from '@/components/WPEmbedCard'

const articleUrl = 'https://webdevstudios.com/2015/04/09/fundamentals-writing-clean-code/'

const oEmbedResponse = {
  version: '1.0',
  type: 'rich',
  title: 'The Fundamentals of Writing Clean Code',
  description: 'Learn the core principles of writing maintainable code.',
  provider_name: 'WebDevStudios',
  provider_url: 'https://webdevstudios.com',
  thumbnail_url: 'https://webdevstudios.com/thumb.jpg',
  thumbnail_width: 600,
  thumbnail_height: 400,
}

describe('WPEmbedCard', () => {
  it('renders a loading state before oEmbed data arrives', () => {
    // Delay the response indefinitely so we see the loading state
    server.use(
      http.get('/api/oembed', () => new Promise(() => {}))
    )
    render(
      <WPEmbedCard
        url={articleUrl}
        providerName="WebDevStudios"
        fallbackTitle="The Fundamentals of Writing Clean Code"
      />
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders ArticleCard with oEmbed data when fetch succeeds', async () => {
    server.use(
      http.get('/api/oembed', () => HttpResponse.json(oEmbedResponse))
    )
    render(
      <WPEmbedCard
        url={articleUrl}
        providerName="WebDevStudios"
        fallbackTitle="The Fundamentals of Writing Clean Code"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('The Fundamentals of Writing Clean Code')).toBeInTheDocument()
    })
    expect(screen.getByText('WebDevStudios')).toBeInTheDocument()
  })

  it('renders fallback card with title and provider when oEmbed fetch fails', async () => {
    server.use(
      http.get('/api/oembed', () => HttpResponse.json({ error: 'Not found' }, { status: 502 }))
    )
    render(
      <WPEmbedCard
        url={articleUrl}
        providerName="WebDevStudios"
        fallbackTitle="The Fundamentals of Writing Clean Code"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('The Fundamentals of Writing Clean Code')).toBeInTheDocument()
    })
    expect(screen.getByText('WebDevStudios')).toBeInTheDocument()
  })

  it('calls /api/oembed with the encoded article URL', async () => {
    let requestedUrl: string | null = null
    server.use(
      http.get('/api/oembed', ({ request }) => {
        requestedUrl = request.url
        return HttpResponse.json(oEmbedResponse)
      })
    )
    render(
      <WPEmbedCard
        url={articleUrl}
        providerName="WebDevStudios"
        fallbackTitle="Fallback"
      />
    )
    await waitFor(() => expect(requestedUrl).not.toBeNull())
    expect(requestedUrl).toContain('/api/oembed')
    expect(requestedUrl).toContain(encodeURIComponent('https://webdevstudios.com'))
  })
})
