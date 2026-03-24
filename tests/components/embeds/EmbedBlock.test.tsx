/**
 * EmbedBlock — WordPress oEmbed figure wrapper
 *
 * Tests that EmbedBlock generates the correct WordPress figure/class hierarchy
 * for all supported embed types and providers.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { EmbedBlock } from '@/components/embeds/EmbedBlock'

describe('EmbedBlock', () => {
  // ── Base class generation ────────────────────────────────────────────────

  it('always includes wp-block-embed base class', () => {
    const { container } = render(
      <EmbedBlock provider="youtube" type="video"><iframe title="t" src="x" /></EmbedBlock>
    )
    expect(container.querySelector('figure')!.classList.contains('wp-block-embed')).toBe(true)
  })

  it('adds is-type-{type} class', () => {
    const { container } = render(
      <EmbedBlock provider="spotify" type="rich"><iframe title="t" src="x" /></EmbedBlock>
    )
    expect(container.querySelector('figure')!.classList.contains('is-type-rich')).toBe(true)
  })

  it('adds is-provider-{provider} class', () => {
    const { container } = render(
      <EmbedBlock provider="vimeo" type="video"><iframe title="t" src="x" /></EmbedBlock>
    )
    expect(container.querySelector('figure')!.classList.contains('is-provider-vimeo')).toBe(true)
  })

  it('adds wp-block-embed-{provider} class', () => {
    const { container } = render(
      <EmbedBlock provider="soundcloud" type="rich"><iframe title="t" src="x" /></EmbedBlock>
    )
    expect(container.querySelector('figure')!.classList.contains('wp-block-embed-soundcloud')).toBe(true)
  })

  it('wraps children in .wp-block-embed__wrapper div', () => {
    const { container } = render(
      <EmbedBlock provider="youtube" type="video"><span data-testid="child">content</span></EmbedBlock>
    )
    const wrapper = container.querySelector('.wp-block-embed__wrapper')!
    expect(wrapper).toBeInTheDocument()
    expect(wrapper.querySelector('[data-testid="child"]')).toBeInTheDocument()
  })

  // ── Aspect ratio ──────────────────────────────────────────────────────────

  it('adds aspect ratio classes when aspectRatio is provided', () => {
    const { container } = render(
      <EmbedBlock provider="youtube" type="video" aspectRatio="16-9"><iframe title="t" src="x" /></EmbedBlock>
    )
    const fig = container.querySelector('figure')!
    expect(fig.classList.contains('wp-embed-aspect-16-9')).toBe(true)
    expect(fig.classList.contains('wp-has-aspect-ratio')).toBe(true)
  })

  it('omits aspect ratio classes when aspectRatio is not provided', () => {
    const { container } = render(
      <EmbedBlock provider="spotify" type="rich"><iframe title="t" src="x" /></EmbedBlock>
    )
    const fig = container.querySelector('figure')!
    expect(fig.classList.contains('wp-has-aspect-ratio')).toBe(false)
  })

  it('supports 4-3 aspect ratio', () => {
    const { container } = render(
      <EmbedBlock provider="slideshare" type="rich" aspectRatio="4-3"><iframe title="t" src="x" /></EmbedBlock>
    )
    const fig = container.querySelector('figure')!
    expect(fig.classList.contains('wp-embed-aspect-4-3')).toBe(true)
    expect(fig.classList.contains('wp-has-aspect-ratio')).toBe(true)
  })

  // ── Provider class normalisation ──────────────────────────────────────────

  it('converts provider with hyphens correctly (e.g. wordpress-tv)', () => {
    const { container } = render(
      <EmbedBlock provider="wordpress-tv" type="video"><iframe title="t" src="x" /></EmbedBlock>
    )
    const fig = container.querySelector('figure')!
    expect(fig.classList.contains('is-provider-wordpress-tv')).toBe(true)
    expect(fig.classList.contains('wp-block-embed-wordpress-tv')).toBe(true)
  })

  // ── Wrapper style passthrough ──────────────────────────────────────────────

  it('applies wrapperStyle to the inner wrapper div', () => {
    const { container } = render(
      <EmbedBlock provider="imgur" type="rich" wrapperStyle={{ display: 'flex', justifyContent: 'center' }}>
        <blockquote className="imgur-embed-pub" data-id="a/test">link</blockquote>
      </EmbedBlock>
    )
    const wrapper = container.querySelector('.wp-block-embed__wrapper') as HTMLDivElement
    expect(wrapper.style.display).toBe('flex')
    expect(wrapper.style.justifyContent).toBe('center')
  })

  // ── Specific providers ────────────────────────────────────────────────────

  it.each([
    { provider: 'youtube',       type: 'video' as const, aspectRatio: '16-9' as const },
    { provider: 'vimeo',         type: 'video' as const, aspectRatio: '16-9' as const },
    { provider: 'dailymotion',   type: 'video' as const, aspectRatio: '16-9' as const },
    { provider: 'videopress',    type: 'video' as const, aspectRatio: '16-9' as const },
    { provider: 'wordpress-tv',  type: 'video' as const, aspectRatio: '16-9' as const },
    { provider: 'spotify',       type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'soundcloud',    type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'mixcloud',      type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'reverbnation',  type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'tiktok',        type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'instagram',     type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'tumblr',        type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'reddit',        type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'imgur',         type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'slideshare',    type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'kickstarter',   type: 'rich'  as const, aspectRatio: undefined },
    { provider: 'flickr',        type: 'photo' as const, aspectRatio: undefined },
  ])('generates correct classes for $provider', ({ provider, type, aspectRatio }) => {
    const { container } = render(
      <EmbedBlock provider={provider} type={type} aspectRatio={aspectRatio}>
        <span>content</span>
      </EmbedBlock>
    )
    const fig = container.querySelector('figure')!
    expect(fig.classList.contains('wp-block-embed')).toBe(true)
    expect(fig.classList.contains(`is-type-${type}`)).toBe(true)
    expect(fig.classList.contains(`is-provider-${provider}`)).toBe(true)
    expect(fig.classList.contains(`wp-block-embed-${provider}`)).toBe(true)
    if (aspectRatio) {
      expect(fig.classList.contains(`wp-embed-aspect-${aspectRatio}`)).toBe(true)
      expect(fig.classList.contains('wp-has-aspect-ratio')).toBe(true)
    }
  })
})
