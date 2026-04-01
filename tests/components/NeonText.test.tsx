import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NeonText from '@/components/NeonText'

describe('NeonText', () => {
  it('renders children', () => {
    render(<NeonText>jazzsequence</NeonText>)
    expect(screen.getByText('jazzsequence')).toBeTruthy()
  })

  it('applies the neon-text CSS class', () => {
    const { container } = render(<NeonText>jazzsequence</NeonText>)
    expect(container.firstChild).toHaveClass('neon-text')
  })

  it('renders as a span by default', () => {
    const { container } = render(<NeonText>jazzsequence</NeonText>)
    expect(container.querySelector('span')).toBeTruthy()
  })

  it('renders as the specified element', () => {
    const { container } = render(<NeonText as="h1">jazzsequence</NeonText>)
    expect(container.querySelector('h1')).toBeTruthy()
  })

  it('passes through additional className', () => {
    const { container } = render(
      <NeonText className="font-mono font-bold">jazzsequence</NeonText>
    )
    expect(container.firstChild).toHaveClass('neon-text')
    expect(container.firstChild).toHaveClass('font-mono')
    expect(container.firstChild).toHaveClass('font-bold')
  })
})
