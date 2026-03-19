import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/Footer'

describe('Footer', () => {
  it('renders a footer element', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).toBeTruthy()
  })

  it('renders the site title "jazzsequence"', () => {
    render(<Footer />)
    expect(screen.getByText('jazzsequence')).toBeTruthy()
  })

  it('renders copyright text with the current year', () => {
    render(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(`${year}.*Chris Reynolds`))).toBeTruthy()
  })

  it('renders social links with Font Awesome icons', () => {
    const { container } = render(<Footer />)
    const faIcons = container.querySelectorAll('i[class*="fa-"]')
    expect(faIcons.length).toBeGreaterThan(0)
  })

  it('renders social links with accessible aria-labels', () => {
    const { container } = render(<Footer />)
    const socialLinks = container.querySelectorAll('a[aria-label]')
    expect(socialLinks.length).toBeGreaterThan(5)
  })

  it('includes a GitHub social link', () => {
    const { container } = render(<Footer />)
    const githubLink = container.querySelector('a[aria-label*="GitHub"]')
    expect(githubLink).toBeTruthy()
    expect((githubLink as HTMLAnchorElement)?.href).toContain('github.com/jazzsequence')
  })

  it('includes a Bluesky social link', () => {
    const { container } = render(<Footer />)
    const bskyLink = container.querySelector('a[aria-label*="Bluesky"]')
    expect(bskyLink).toBeTruthy()
  })
})
