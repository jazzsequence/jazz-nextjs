/**
 * Design Tokens — jazzsequence.com design system
 *
 * This story is the canonical reference for all design tokens.
 * Every color, font, and spacing value used in components must
 * come from these tokens. Do not use arbitrary values in components.
 *
 * CSS custom properties are defined in app/globals.css.
 * Tailwind theme (brand.* colors, font-* families) is defined in app/globals.css @theme.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'

// ── Color tokens ─────────────────────────────────────────────────────────────

const colors = [
  { token: '--color-bg',           tailwind: 'bg-brand-bg',           hex: '#0d0d1a', label: 'Background',       contrast: '—' },
  { token: '--color-surface',      tailwind: 'bg-brand-surface',       hex: '#13132b', label: 'Surface',          contrast: '—' },
  { token: '--color-surface-high', tailwind: 'bg-brand-surface-high',  hex: '#1c1c3a', label: 'Surface Elevated', contrast: '—' },
  { token: '--color-border',       tailwind: 'border-brand-border',    hex: '#2a2a4a', label: 'Border',           contrast: '—' },
  { token: '--color-border-bright',tailwind: 'border-brand-border-bright', hex: '#3d3d6b', label: 'Border Bright', contrast: '—' },
  { token: '--color-text',         tailwind: 'text-brand-text',        hex: '#f0eeff', label: 'Text Primary',     contrast: '17.4:1 AAA' },
  { token: '--color-text-sub',     tailwind: 'text-brand-text-sub',    hex: '#c4c0e0', label: 'Text Secondary',   contrast: '10.2:1 AAA' },
  { token: '--color-muted',        tailwind: 'text-brand-muted',       hex: '#a09abb', label: 'Text Muted',       contrast: '7.2:1 AA' },
  { token: '--color-cyan',         tailwind: 'text-brand-cyan',        hex: '#00e5cc', label: 'Accent Cyan',      contrast: '12.2:1 AAA' },
  { token: '--color-magenta',      tailwind: 'text-brand-magenta',     hex: '#ff2d78', label: 'Accent Magenta',   contrast: '3.6:1 (decorative / large text only)' },
  { token: '--color-purple',       tailwind: 'text-brand-purple',      hex: '#9d5cff', label: 'Accent Purple',    contrast: '5.2:1 AA' },
  { token: '--color-header',       tailwind: 'bg-brand-header',        hex: '#0a0a18', label: 'Header/Footer',    contrast: '—' },
]

// ── Font tokens ───────────────────────────────────────────────────────────────

const fonts = [
  {
    token: '--font-mono',
    tailwind: 'font-mono',
    value: '"Victor Mono", monospace',
    usage: 'Site title, H2 headings (post/section titles), code, eyebrow labels',
    specimen: 'jazzsequence  0123456789  const x = 42',
  },
  {
    token: '--font-heading',
    tailwind: 'font-heading',
    value: '"Geist Sans", system-ui, sans-serif',
    usage: 'H1, H3, H4, UI labels, meta text, navigation',
    specimen: 'Style Guide  Music, Games, Writing & Tech  Published March 2026',
  },
  {
    token: '--font-body',
    tailwind: 'font-sans',
    value: '"Space Grotesk", system-ui, sans-serif',
    usage: 'Body prose, descriptions, paragraph text',
    specimen: 'Jazzsequence.com is a personal site by Chris Reynolds covering electronic music mixes, board games, writing, and technology.',
  },
]

// ── Heading scale ─────────────────────────────────────────────────────────────

const headings = [
  { tag: 'H1', font: 'Geist Sans', size: '2.5rem', weight: '700', tailwind: 'font-heading text-4xl font-bold' },
  { tag: 'H2', font: 'Victor Mono', size: '2.25rem', weight: '700', tailwind: 'font-mono text-4xl font-bold', note: 'Post/section titles only' },
  { tag: 'H3', font: 'Geist Sans', size: '1.5rem', weight: '600', tailwind: 'font-heading text-2xl font-semibold' },
  { tag: 'H4', font: 'Geist Sans', size: '1.125rem', weight: '600', tailwind: 'font-heading text-lg font-semibold' },
  { tag: 'Body', font: 'Space Grotesk', size: '1.1rem', weight: '400', tailwind: 'font-sans text-base' },
  { tag: 'Meta', font: 'Geist Sans', size: '0.875rem', weight: '400', tailwind: 'font-heading text-sm' },
  { tag: 'Eyebrow', font: 'Victor Mono', size: '0.6875rem', weight: '700', tailwind: 'font-mono text-xs uppercase tracking-widest', note: 'Category labels, section dividers' },
]

function ColorSwatch({ token, tailwind, hex, label, contrast }: typeof colors[0]) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
      <div style={{
        width: '3rem', height: '3rem', borderRadius: '0.375rem', flexShrink: 0,
        background: hex, border: '1px solid #2a2a4a',
      }} />
      <div>
        <div style={{ color: '#f0eeff', fontFamily: '"Geist Sans", system-ui', fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
        <div style={{ color: '#a09abb', fontFamily: '"Victor Mono", monospace', fontSize: '0.75rem' }}>{hex}</div>
        <div style={{ color: '#a09abb', fontFamily: '"Victor Mono", monospace', fontSize: '0.6875rem' }}>
          {token} · {tailwind}
        </div>
        {contrast !== '—' && (
          <div style={{ color: '#00e5cc', fontFamily: '"Geist Sans", system-ui', fontSize: '0.6875rem' }}>
            {contrast} on bg
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2 style={{
        color: '#00e5cc', fontFamily: '"Victor Mono", monospace', fontWeight: 700,
        fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase',
        marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #2a2a4a',
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function DesignTokensDoc() {
  return (
    <div style={{ background: '#0d0d1a', minHeight: '100vh', padding: '3rem', fontFamily: '"Space Grotesk", system-ui' }}>
      <h1 style={{ color: '#f0eeff', fontFamily: '"Geist Sans", system-ui', fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Design Tokens
      </h1>
      <p style={{ color: '#a09abb', marginBottom: '3rem', fontFamily: '"Geist Sans", system-ui', fontSize: '0.875rem' }}>
        Canonical reference. All component styles must reference these tokens — no arbitrary hex values or font names in components.
      </p>

      <Section title="Colors">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.25rem 2rem' }}>
          {colors.map(c => <ColorSwatch key={c.token} {...c} />)}
        </div>
      </Section>

      <Section title="Typography — Font Families">
        {fonts.map(f => (
          <div key={f.token} style={{ marginBottom: '2rem', padding: '1.25rem', background: '#13132b', border: '1px solid #2a2a4a', borderRadius: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#00e5cc', fontFamily: '"Victor Mono", monospace', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {f.tailwind}
              </span>
              <span style={{ color: '#a09abb', fontFamily: '"Victor Mono", monospace', fontSize: '0.6875rem' }}>{f.token}</span>
            </div>
            <p style={{ color: '#a09abb', fontFamily: '"Geist Sans", system-ui', fontSize: '0.75rem', marginBottom: '0.75rem' }}>{f.usage}</p>
            <div style={{ fontFamily: f.value, color: '#c4c0e0', fontSize: '1rem' }}>{f.specimen}</div>
          </div>
        ))}
      </Section>

      <Section title="Typography — Heading Scale">
        {headings.map(h => (
          <div key={h.tag} style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #2a2a4a' }}>
            <div style={{ color: '#a09abb', fontFamily: '"Victor Mono", monospace', fontSize: '0.6875rem', width: '4rem', flexShrink: 0 }}>{h.tag}</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: h.font === 'Victor Mono' ? '"Victor Mono", monospace' : h.font === 'Space Grotesk' ? '"Space Grotesk", system-ui' : '"Geist Sans", system-ui',
                fontSize: h.size,
                fontWeight: h.weight,
                color: '#f0eeff',
                lineHeight: 1.3,
              }}>
                {h.tag} — {h.font} {h.size}
                {h.note && <span style={{ color: '#a09abb', fontSize: '0.75rem', fontWeight: 400, marginLeft: '0.75rem' }}>({h.note})</span>}
              </div>
              <div style={{ color: '#a09abb', fontFamily: '"Victor Mono", monospace', fontSize: '0.6875rem', marginTop: '0.25rem' }}>{h.tailwind}</div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Retrowave Gradients">
        <p style={{ color: '#a09abb', fontFamily: '"Geist Sans", system-ui', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
          All four gradients use the same three-color palette: <code style={{ background: '#1c1c3a', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#00e5cc' }}>#2d0b4e → #0b2d4e → #1a0d2e</code>.
          The opaque version is for placeholders; the semi-transparent version tints real images.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            {
              label: 'Image placeholder (opaque)',
              note: 'Used when no featured image exists — PostCard, GameCard',
              value: 'linear-gradient(135deg, #2d0b4e 0%, #0b2d4e 50%, #1a0d2e 100%)',
              var: '--gradient-image-placeholder',
            },
            {
              label: 'Image tint (semi-transparent)',
              note: 'Layered over real images — same palette, ~50% opacity',
              value: 'linear-gradient(135deg, rgba(45,11,78,0.5) 0%, rgba(11,45,78,0.45) 50%, rgba(26,13,46,0.45) 100%)',
              var: '--gradient-image-tint',
            },
            {
              label: 'Hero / Decorative (dark)',
              note: 'Used for hero cards, section backgrounds — not for image placeholders',
              value: 'linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)',
              var: '--gradient-hero',
            },
            {
              label: 'Dark fade (text legibility)',
              note: 'Layered at bottom of image areas so overlaid text is readable',
              value: 'linear-gradient(to bottom, transparent 0%, rgba(13,13,26,0.6) 60%, #13132b 100%)',
              var: '--gradient-fade-dark',
            },
          ].map(g => (
            <div key={g.var} style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #2a2a4a' }}>
              <div style={{ height: '6rem', background: g.value, position: 'relative' }}>
                <div aria-hidden style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'linear-gradient(#2a2a4a33 1px, transparent 1px), linear-gradient(90deg, #2a2a4a33 1px, transparent 1px)',
                  backgroundSize: '1.5rem 1.5rem',
                }} />
              </div>
              <div style={{ padding: '0.75rem', background: '#13132b' }}>
                <div style={{ color: '#f0eeff', fontFamily: '"Geist Sans", system-ui', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{g.label}</div>
                <div style={{ color: '#a09abb', fontFamily: '"Victor Mono", monospace', fontSize: '0.625rem' }}>{g.var}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

const meta: Meta = {
  title: 'Design System/Tokens',
  component: DesignTokensDoc,
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
    a11y: { test: 'todo' }, // Doc story only — no interactive elements to audit
  },
}
export default meta

export const AllTokens: StoryObj = {
  render: () => <DesignTokensDoc />,
}
