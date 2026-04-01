/**
 * Neon Effects — design approval story
 *
 * Shows the two neon effects before they are applied to live components:
 *   1. NeonText  — site-name glow with idle flicker and link hover
 *   2. .neon-border-hover — border glow for cards and bordered UI elements
 *
 * Approve the design here before the effects are wired into Navigation/Footer.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import NeonText from '@/components/NeonText'

const meta: Meta = {
  title: 'Design System/Neon Effects',
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
}

export default meta
type Story = StoryObj

// ── Site name — NeonText ─────────────────────────────────────────────────────

/**
 * Idle state — abrupt tube-struggling flicker fires three times per 8s cycle.
 * The "off" frames are dim, not dark. Watch for a few seconds to see it.
 */
export const SiteNameIdle: Story = {
  name: 'Site name — idle flicker',
  render: () => (
    <div className="p-12 flex flex-col items-center gap-8 bg-brand-header rounded-lg">
      <a href="#" className="no-underline" onClick={(e) => e.preventDefault()}>
        <NeonText className="font-mono font-bold text-brand-cyan text-2xl tracking-tight">
          jazzsequence
        </NeonText>
      </a>
      <p className="text-brand-muted text-sm font-body text-center max-w-xs">
        Idle — rapid stutter fires three times per 8s cycle (~35%, ~63%, ~88%).
        The glow dims but never fully dies.
      </p>
    </div>
  ),
}

/**
 * Hover state — tube lights up brighter and holds steady.
 * Hover the link above the label to see it. The play function triggers it automatically.
 */
export const SiteNameHover: Story = {
  name: 'Site name — hover (lit up)',
  render: () => (
    <div className="p-12 flex flex-col items-center gap-8 bg-brand-header rounded-lg">
      <a href="#" className="no-underline" onClick={(e) => e.preventDefault()}>
        <NeonText className="font-mono font-bold text-brand-cyan text-2xl tracking-tight">
          jazzsequence
        </NeonText>
      </a>
      <p className="text-brand-muted text-sm font-body">
        Hover the text — flicker stops, glow intensifies.
      </p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { within, userEvent } = await import('@storybook/test')
    const canvas = within(canvasElement)
    const el = canvas.getByText('jazzsequence')
    await userEvent.hover(el)
  },
}

/** Comparison: no effect vs idle vs hover — all three states side by side. */
export const SiteNameComparison: Story = {
  name: 'Site name — all states',
  render: () => (
    <div className="p-12 bg-brand-header rounded-lg flex gap-12 items-end">
      <div className="flex flex-col items-center gap-3">
        <span className="font-mono font-bold text-brand-cyan text-2xl tracking-tight">
          jazzsequence
        </span>
        <span className="text-brand-muted text-xs font-body">no effect</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <NeonText className="font-mono font-bold text-brand-cyan text-2xl tracking-tight">
          jazzsequence
        </NeonText>
        <span className="text-brand-muted text-xs font-body">idle glow</span>
      </div>
      <div className="flex flex-col items-center gap-3">
        {/* Force hover state via inline style to show the hover glow statically */}
        <span
          className="font-mono font-bold text-2xl tracking-tight"
          style={{
            color: '#ff2d78',
            textShadow: [
              '0 0 6px #ff2d78',
              '0 0 16px #ff2d78',
              '0 0 32px rgba(255,45,120,0.7)',
              '0 0 60px rgba(255,45,120,0.3)',
            ].join(', '),
          }}
        >
          jazzsequence
        </span>
        <span className="text-brand-muted text-xs font-body">hover (magenta)</span>
      </div>
    </div>
  ),
}

// ── Border glow — .neon-border-hover ─────────────────────────────────────────

/** Hover any element to see the border light up. Hold for 1s to trigger the tube flicker. */
export const BorderGlow: Story = {
  name: 'Border glow — hover (hold 1s for flicker)',
  render: () => (
    <div className="p-12 flex flex-col gap-6 min-w-[420px] bg-brand-bg rounded-lg">
      <p className="text-brand-muted text-sm font-body -mb-2">
        Hover — border lights up. Hold for 1s — tube starts to flicker.
      </p>

      {/* Card */}
      <div className="neon-border-hover border border-brand-border rounded-lg p-6 bg-brand-surface cursor-pointer">
        <h3 className="font-heading text-brand-text text-base font-semibold mb-1">Post Card</h3>
        <p className="text-brand-text-sub text-sm font-body">
          Border becomes a glowing cyan tube on hover.
        </p>
      </div>

      {/* Tag pill */}
      <div className="flex gap-2 flex-wrap">
        {['jazz', 'code', 'games', 'music'].map((tag) => (
          <button
            key={tag}
            className="neon-border-hover border border-brand-border rounded-full px-3 py-1 text-brand-text-sub text-xs font-heading bg-brand-surface"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex gap-2">
        {['←', '1', '2', '3', '→'].map((n) => (
          <button
            key={n}
            className="neon-border-hover border border-brand-border rounded w-9 h-9 text-brand-text-sub text-sm font-mono bg-brand-surface"
          >
            {n}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="neon-border-hover border border-brand-border rounded px-3 py-2 bg-brand-surface text-brand-muted text-sm font-body cursor-text">
        Search...
      </div>
    </div>
  ),
}

/** Side-by-side: plain border-on-hover vs neon-border-hover */
export const BorderComparison: Story = {
  name: 'Border glow — comparison',
  render: () => (
    <div className="p-12 bg-brand-bg rounded-lg flex gap-10 items-start">
      <div className="flex flex-col gap-3">
        <div className="border border-brand-border hover:border-brand-cyan rounded-lg p-5 bg-brand-surface cursor-pointer transition-colors w-44">
          <p className="text-brand-text-sub text-sm font-body">Hover me</p>
          <p className="text-brand-muted text-xs font-body mt-1">border colour only</p>
        </div>
        <span className="text-brand-muted text-xs font-body text-center">existing behaviour</span>
      </div>
      <div className="flex flex-col gap-3">
        <div className="neon-border-hover border border-brand-border rounded-lg p-5 bg-brand-surface cursor-pointer w-44">
          <p className="text-brand-text-sub text-sm font-body">Hover me</p>
          <p className="text-brand-muted text-xs font-body mt-1">border glow</p>
        </div>
        <span className="text-brand-muted text-xs font-body text-center">with .neon-border-hover</span>
      </div>
    </div>
  ),
}
