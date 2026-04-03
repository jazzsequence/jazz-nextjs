import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import OGCard, { OG_SIZE, OG_COLORS } from '@/components/OGCard'

describe('OGCard', () => {
  it('renders the site name "jazzsequence"', () => {
    render(<OGCard />)
    expect(screen.getByText('jazzsequence')).toBeTruthy()
  })

  it('renders the default tagline when none provided', () => {
    render(<OGCard />)
    expect(screen.getByText('I make websites and things')).toBeTruthy()
  })

  it('renders a custom tagline', () => {
    render(<OGCard tagline="custom tagline" />)
    expect(screen.getByText('custom tagline')).toBeTruthy()
  })

  it('renders at the correct OG dimensions (1200×630)', () => {
    const { container } = render(<OGCard />)
    const root = container.firstChild as HTMLElement
    expect(root.style.width).toBe(`${OG_SIZE.width}px`)
    expect(root.style.height).toBe(`${OG_SIZE.height}px`)
  })

  it('uses the retrowave dusk gradient as background', () => {
    const { container } = render(<OGCard />)
    const root = container.firstChild as HTMLElement
    expect(root.style.background).toContain(OG_COLORS.gradientTop)
    expect(root.style.background).toContain(OG_COLORS.gradientMid)
  })

  it('applies neon glow text-shadow to site name', () => {
    const { container } = render(<OGCard />)
    const siteNameEl = container.querySelector('[style*="jazzsequence"]') ??
      Array.from(container.querySelectorAll('div')).find(
        el => el.textContent === 'jazzsequence'
      )
    expect(siteNameEl?.style.textShadow).toContain(OG_COLORS.cyan)
  })

  it('exports OG_SIZE with correct dimensions', () => {
    expect(OG_SIZE.width).toBe(1200)
    expect(OG_SIZE.height).toBe(630)
  })
})
