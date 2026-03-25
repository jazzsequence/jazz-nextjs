/**
 * ArticleCard — shared article embed card matching the WordPressPost Storybook design.
 *
 * Used by WPEmbedCard (native WP post embeds) and by the PostContent interceptor
 * for Pantheon custom Gutenberg groups. Both render this card to ensure consistency.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ArticleCard from '@/components/ArticleCard'

const minimalProps = {
  href: 'https://webdevstudios.com/2015/04/09/fundamentals-writing-clean-code/',
  title: 'The Fundamentals of Writing Clean Code',
  sourceName: 'WebDevStudios',
  sourceUrl: 'https://webdevstudios.com',
}

describe('ArticleCard', () => {
  it('renders the article title as a link', () => {
    render(<ArticleCard {...minimalProps} />)
    const link = screen.getByRole('link', { name: /Fundamentals of Writing Clean Code/i })
    expect(link).toHaveAttribute('href', minimalProps.href)
  })

  it('renders the source name in the footer', () => {
    render(<ArticleCard {...minimalProps} />)
    expect(screen.getByText('WebDevStudios')).toBeInTheDocument()
  })

  it('renders without excerpt when none provided', () => {
    const { container } = render(<ArticleCard {...minimalProps} />)
    // No excerpt element should be rendered
    expect(container.querySelector('[data-testid="article-excerpt"]')).not.toBeInTheDocument()
  })

  it('renders excerpt when provided', () => {
    render(
      <ArticleCard
        {...minimalProps}
        excerpt="Learn the core principles of writing maintainable code."
      />
    )
    expect(
      screen.getByText('Learn the core principles of writing maintainable code.')
    ).toBeInTheDocument()
  })

  it('renders a favicon image when faviconUrl is provided', () => {
    const { container } = render(
      <ArticleCard
        {...minimalProps}
        faviconUrl="https://webdevstudios.com/favicon.ico"
      />
    )
    // Favicon has alt="" (decorative) so use querySelector rather than getByRole
    const favicon = container.querySelector('img[src*="favicon.ico"]')
    expect(favicon).toBeInTheDocument()
  })

  it('renders a hero image when imageUrl is provided', () => {
    render(
      <ArticleCard
        {...minimalProps}
        imageUrl="https://webdevstudios.com/thumb.jpg"
        imageAlt="Article thumbnail"
      />
    )
    const img = screen.getByAltText('Article thumbnail')
    expect(img).toBeInTheDocument()
  })

  it('does not render hero image section when imageUrl is absent', () => {
    const { container } = render(<ArticleCard {...minimalProps} />)
    expect(container.querySelector('[data-testid="article-hero"]')).not.toBeInTheDocument()
  })

  it('wraps the entire card in a link to the article', () => {
    const { container } = render(<ArticleCard {...minimalProps} />)
    const cardLink = container.querySelector('a[href="' + minimalProps.href + '"]')
    expect(cardLink).toBeInTheDocument()
  })

  it('source link goes to sourceUrl, not article href', () => {
    render(<ArticleCard {...minimalProps} />)
    const sourceLink = screen.getByText('WebDevStudios').closest('a')
    expect(sourceLink).toHaveAttribute('href', 'https://webdevstudios.com')
  })
})
