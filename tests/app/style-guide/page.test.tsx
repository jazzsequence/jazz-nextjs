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
})
