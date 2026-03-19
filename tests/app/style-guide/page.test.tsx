import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StyleGuidePage from '@/app/style-guide/page'

describe('StyleGuidePage', () => {
  it('renders the page heading', () => {
    render(<StyleGuidePage />)
    expect(screen.getByRole('heading', { name: /style guide/i })).toBeTruthy()
  })

  it('renders the colors section', () => {
    render(<StyleGuidePage />)
    expect(screen.getByText(/colors/i)).toBeTruthy()
  })

  it('renders the typography section', () => {
    render(<StyleGuidePage />)
    expect(screen.getByText(/typography/i)).toBeTruthy()
  })

  it('renders the components section', () => {
    render(<StyleGuidePage />)
    expect(screen.getByText(/components/i)).toBeTruthy()
  })

  it('renders the site title in the header', () => {
    render(<StyleGuidePage />)
    // "jazzsequence" appears in both header and footer — check for header nav landmark
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeTruthy()
    expect(screen.getAllByText('jazzsequence').length).toBeGreaterThanOrEqual(2)
  })

  it('renders Font Awesome icon classes in the footer social links', () => {
    const { container } = render(<StyleGuidePage />)
    // Check for FA icon elements in the footer
    const faIcons = container.querySelectorAll('i[class*="fa-"]')
    expect(faIcons.length).toBeGreaterThan(0)
  })

  it('renders the image overlay section', () => {
    render(<StyleGuidePage />)
    expect(screen.getByText(/image overlay/i)).toBeTruthy()
  })

  it('renders Victor Mono as the monospace font in the header title', () => {
    const { container } = render(<StyleGuidePage />)
    // The site title link uses Victor Mono font family
    const siteTitle = container.querySelector('a[href="/"]')
    expect(siteTitle).toBeTruthy()
    const style = (siteTitle as HTMLElement)?.style?.fontFamily || ''
    expect(style.toLowerCase()).toContain('victor mono')
  })

  it('renders the font choices rationale section', () => {
    render(<StyleGuidePage />)
    expect(screen.getByText(/font choices/i)).toBeTruthy()
  })

  it('renders sans-serif font comparison options', () => {
    render(<StyleGuidePage />)
    // Should show multiple sans-serif options for evaluation (text appears in font stacks too)
    expect(screen.getAllByText(/sans-serif/i).length).toBeGreaterThan(0)
  })
})
