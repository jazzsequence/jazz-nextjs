'use client'

/**
 * Design System Style Guide
 *
 * Preview page for the retrowave/synthwave dark theme.
 * Self-contained — all styles reference the `c` (colors) and `t` (text styles)
 * constants below, which represent the design tokens for the global theme.
 *
 * 'use client' required for hover event handlers on interactive preview elements.
 */

import { useEffect } from 'react'
import Link from 'next/link'

// ─── Color tokens ────────────────────────────────────────────────────────────

const c = {
  bg:          '#0d0d1a',
  surface:     '#13132b',
  surfaceHigh: '#1c1c3a',
  border:      '#2a2a4a',
  borderBright:'#3d3d6b',
  text:        '#f0eeff',
  textSub:     '#c4c0e0',
  muted:       '#a09abb',
  cyan:        '#00e5cc',
  magenta:     '#ff2d78',
  purple:      '#9d5cff',
  cyanDim:     '#00b3a4',
  magentaDim:  '#cc2460',
} as const

// ─── Text style tokens ────────────────────────────────────────────────────────
//
// These are the design system's named text styles.
// Each represents a reusable combination of font, size, weight, and color.
//
// Font assignments:
//   Victor Mono  — site title, H2 headings (post/section titles), code, eyebrow labels
//   Geist Sans   — H1, H3, H4, UI labels, meta/small text
//   Space Grotesk — body prose, descriptions, paragraph text

const t = {
  // Eyebrow label: small, monospace, uppercase — used for section dividers and UI labels
  eyebrow: {
    color: c.cyan,
    fontSize: '0.6875rem',
    fontFamily: '"Victor Mono", monospace',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
  },

  // H1: Page titles, largest heading level
  h1: {
    fontFamily: '"Geist Sans", system-ui, sans-serif',
    fontSize: '2.5rem',
    fontWeight: 700,
    color: c.text,
  },

  // H2: Section titles, post titles — Victor Mono for distinctive character
  h2: {
    fontFamily: '"Victor Mono", monospace',
    fontSize: '2.25rem',
    fontWeight: 700,
    color: c.text,
  },

  // H3: Subsection headings
  h3: {
    fontFamily: '"Geist Sans", system-ui, sans-serif',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: c.text,
  },

  // H4: Small headings, UI section labels
  h4: {
    fontFamily: '"Geist Sans", system-ui, sans-serif',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: c.textSub,
  },

  // Body: Prose, descriptions, paragraph text
  body: {
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    fontSize: '1.1rem',
    lineHeight: 1.75 as number,
    color: c.text,
  },

  // Meta: Published dates, tags, auxiliary info
  meta: {
    fontFamily: '"Geist Sans", system-ui, sans-serif',
    fontSize: '0.875rem',
    lineHeight: 1.7 as number,
    color: c.muted,
  },
} as const

// ─── Helper components ───────────────────────────────────────────────────────

const swatch = (color: string, name: string, hex: string, contrast: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
    <div style={{
      width: '3rem', height: '3rem', borderRadius: '0.375rem',
      background: color, border: `1px solid ${c.border}`, flexShrink: 0,
    }} />
    <div>
      <div style={{ color: c.text, fontWeight: 600, fontSize: '0.875rem', fontFamily: '"Geist Sans", system-ui, sans-serif' }}>{name}</div>
      <div style={{ color: c.muted, fontSize: '0.75rem', fontFamily: '"Victor Mono", monospace' }}>{hex}</div>
      <div style={{ color: c.muted, fontSize: '0.75rem', fontFamily: '"Geist Sans", system-ui, sans-serif' }}>Contrast on bg: <span style={{ color: c.cyan }}>{contrast}</span></div>
    </div>
  </div>
)

// Section divider using t.eyebrow — the style is defined in the design tokens above,
// not inline, so it can be replicated consistently across the site.
const section = (title: string, children: React.ReactNode) => (
  <section style={{ marginBottom: '3rem' }}>
    <h2 style={{
      ...t.eyebrow,
      marginBottom: '1.5rem',
      paddingBottom: '0.5rem',
      borderBottom: `1px solid ${c.border}`,
    }}>
      {title}
    </h2>
    {children}
  </section>
)

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StyleGuidePage() {
  // Load comparison fonts client-side only — skipped in test environments
  // to avoid MSW/happy-dom SSL errors.
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Syne:wght@400;700&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  return (
    <div style={{ background: c.bg, minHeight: '100vh', ...t.body }}>

      {/* ── Sticky Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#0a0a18',
        borderBottom: `1px solid ${c.border}`,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          maxWidth: '80rem', margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '3.5rem',
        }}>
          {/* Site title — Victor Mono */}
          <Link href="/" style={{
            fontFamily: '"Victor Mono", monospace',
            fontWeight: 700,
            fontSize: '1.125rem',
            color: c.cyan,
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}>
            jazzsequence
          </Link>
          <nav aria-label="Main navigation">
            <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {['Posts', 'Games', 'Music', 'About'].map((item) => (
                <li key={item}>
                  <a href="#" style={{
                    color: c.textSub,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    fontFamily: '"Geist Sans", system-ui, sans-serif',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.cyan)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textSub)}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: '60rem', margin: '0 auto', padding: '3rem 1.5rem' }}>

        <h1 style={{ ...t.h1, marginBottom: '0.5rem' }}>Style Guide</h1>
        <p style={{ ...t.meta, marginBottom: '3rem' }}>
          Retrowave / Synthwave dark theme — jazzsequence.com design system
        </p>

        {/* ── COLORS ── */}
        {section('Colors', (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem 2rem' }}>
            {swatch(c.bg,         'Background',      '#0d0d1a', '—')}
            {swatch(c.surface,    'Surface',         '#13132b', '—')}
            {swatch(c.surfaceHigh,'Surface Elevated','#1c1c3a', '—')}
            {swatch(c.border,     'Border',          '#2a2a4a', '—')}
            {swatch(c.text,       'Text Primary',    '#f0eeff', '17.4:1 AAA')}
            {swatch(c.textSub,    'Text Secondary',  '#c4c0e0', '10.2:1 AAA')}
            {swatch(c.muted,      'Text Muted',      '#a09abb', '7.2:1 AA')}
            {swatch(c.cyan,       'Accent Cyan',     '#00e5cc', '12.2:1 AAA')}
            {swatch(c.magenta,    'Accent Magenta',  '#ff2d78', '3.6:1 (large text / decorative only)')}
            {swatch(c.purple,     'Accent Purple',   '#9d5cff', '5.2:1 AA')}
          </div>
        ))}

        {/* ── FONT CHOICES ── */}
        {section('Font Choices', (
          <div>
            {/* Victor Mono */}
            <div style={{ marginBottom: '2rem', padding: '1.25rem', background: c.surface, border: `1px solid ${c.border}`, borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
                <span style={{ ...t.eyebrow }}>Monospace</span>
                <span style={{ color: c.text, fontSize: '1.125rem', fontWeight: 700, fontFamily: '"Victor Mono", monospace' }}>Victor Mono</span>
              </div>
              <p style={{ ...t.meta, lineHeight: 1.6, marginBottom: '1rem', maxWidth: '60ch' }}>
                Slanted monospace with elegant cursive italics and ligatures. Used for: site title, H2 headings (post/section titles), code elements, and eyebrow labels. Its distinctive slope gives the brand a tech identity.
              </p>
              <div style={{ fontFamily: '"Victor Mono", monospace', color: c.cyan, fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }}>jazzsequence</div>
              <div style={{ fontFamily: '"Victor Mono", monospace', color: c.text, fontSize: '2rem', fontWeight: 700, margin: '0.25rem 0' }}>teh s3quence 016</div>
              <div style={{ fontFamily: '"Victor Mono", monospace', color: c.textSub, fontSize: '0.875rem' }}>const greeting = &quot;Good morning, Chris&quot;;</div>
              <div style={{ fontFamily: '"Victor Mono", monospace', color: c.muted, fontSize: '0.875rem', fontStyle: 'italic', marginTop: '0.25rem' }}>{'// italic — cursive italic is distinctive'}</div>
            </div>

            <p style={{ ...t.eyebrow, marginBottom: '1rem', display: 'block' }}>Sans-serif — confirmed choices</p>

            {/* Geist Sans */}
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: c.surface, border: `1px solid ${c.cyan}33`, borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ ...t.eyebrow }}>H1, H3, H4, Labels, Meta</span>
                <span style={{ color: c.text, fontFamily: '"Geist Sans", system-ui, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Geist Sans</span>
              </div>
              <p style={{ ...t.meta, lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: '55ch' }}>
                Extremely clean and legible at all sizes. Chosen for headings where clarity takes priority — H1 page titles, H3/H4 subsections, UI labels, and meta text.
              </p>
              <div style={{ fontFamily: '"Geist Sans", system-ui, sans-serif' }}>
                <div style={{ color: c.text, fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Style Guide</div>
                <div style={{ color: c.muted, fontSize: '0.875rem' }}>Published March 19, 2026 · 4 min read · Tag: music</div>
              </div>
            </div>

            {/* Space Grotesk */}
            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: c.surface, border: `1px solid ${c.cyan}33`, borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ ...t.eyebrow }}>Body Text</span>
                <span style={{ color: c.text, fontFamily: '"Space Grotesk", system-ui, sans-serif', fontWeight: 700, fontSize: '1rem' }}>Space Grotesk</span>
              </div>
              <p style={{ ...t.meta, lineHeight: 1.5, marginBottom: '0.75rem', maxWidth: '55ch' }}>
                Geometric with subtle character — offset bowls, distinctive terminals. Used for all prose, descriptions, and paragraph text.
              </p>
              <div style={{ fontFamily: '"Space Grotesk", system-ui, sans-serif' }}>
                <div style={{ color: c.textSub, fontSize: '1.1rem', lineHeight: 1.75, maxWidth: '55ch' }}>
                  Jazzsequence.com is a personal site covering electronic music mixes, board games, writing, and technology.
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── TYPOGRAPHY ── */}
        {section('Typography', (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ ...t.h1, margin: '0 0 0.5rem' }}>
                Heading 1 — Geist Sans 2.5rem / 700
              </h1>
              <h2 style={{ ...t.h2, margin: '0 0 0.5rem' }}>
                Heading 2 — Victor Mono 2.25rem / 700
              </h2>
              <h3 style={{ ...t.h3, margin: '0 0 0.5rem' }}>
                Heading 3 — Geist Sans 1.5rem / 600
              </h3>
              <h4 style={{ ...t.h4, margin: '0 0 0.5rem' }}>
                Heading 4 — Geist Sans 1.125rem / 600
              </h4>
            </div>
            <p style={{ ...t.body, marginBottom: '1rem', maxWidth: '60ch' }}>
              Body text — Space Grotesk 1.1rem / 1.75 line-height. The quick brown fox jumps over the lazy dog.
              Jazzsequence.com is a personal site covering music, games, writing, and tech.
            </p>
            <p style={{ ...t.meta, marginBottom: '1rem', maxWidth: '60ch' }}>
              Meta / muted text — Geist Sans 0.875rem. Published January 1, 2026 · 5 min read
            </p>
            <p style={{ marginBottom: '1rem' }}>
              <a href="#" style={{ color: c.cyan, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Cyan link — default state
              </a>
              {' · '}
              <a href="#" style={{ color: c.magenta, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Magenta link — hover/active
              </a>
            </p>
            <code style={{
              background: c.surfaceHigh, color: c.cyan,
              padding: '0.125rem 0.5rem', borderRadius: '0.25rem',
              fontSize: '0.875rem', fontFamily: '"Victor Mono", monospace',
            }}>
              inline code example
            </code>
          </div>
        ))}

        {/* ── COMPONENTS ── */}
        {section('Components', (
          <div>

            <p style={{ ...t.eyebrow, display: 'block', marginBottom: '0.75rem' }}>Buttons</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <button style={{
                background: c.cyan, color: '#0d0d1a',
                border: 'none', borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 700,
                fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>Primary (Cyan)</button>
              <button style={{
                background: 'transparent', color: c.cyan,
                border: `1px solid ${c.cyan}`, borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 600,
                fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>Outline</button>
              <button style={{
                background: c.magenta, color: '#0d0d1a',
                border: 'none', borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 700,
                fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>Accent (Magenta)</button>
              <button style={{
                background: c.surfaceHigh, color: c.textSub,
                border: `1px solid ${c.border}`, borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 500,
                fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>Ghost</button>
            </div>

            <p style={{ ...t.eyebrow, display: 'block', marginBottom: '0.75rem' }}>Tags / Badges</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {['synthwave', 'music', 'card game', 'teh s3quence'].map(tag => (
                <span key={tag} style={{
                  background: c.surfaceHigh, color: c.cyan,
                  border: `1px solid ${c.border}`, borderRadius: '9999px',
                  padding: '0.25rem 0.75rem', fontSize: '0.8125rem', fontWeight: 500,
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <p style={{ ...t.eyebrow, display: 'block', marginBottom: '0.75rem' }}>Post Card</p>
            <div style={{
              background: c.surface, border: `1px solid ${c.border}`,
              borderRadius: '0.75rem', overflow: 'hidden',
              maxWidth: '28rem', marginBottom: '2rem',
            }}>
              <div style={{ background: `linear-gradient(135deg, ${c.surfaceHigh} 0%, #1a0d2e 100%)`, height: '8rem' }} />
              <div style={{ padding: '1.25rem' }}>
                <div style={{ ...t.meta, marginBottom: '0.5rem' }}>March 19, 2026 · 4 min read</div>
                <h3 style={{ ...t.h3, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  teh s3quence 016 — spring mix
                </h3>
                <p style={{ ...t.body, fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  After a seemingly long winter, Spring is here again.
                </p>
                <a href="#" style={{ color: c.cyan, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  Read more →
                </a>
              </div>
            </div>

            <p style={{ ...t.eyebrow, display: 'block', marginBottom: '0.75rem' }}>Game Card</p>
            <div style={{
              background: c.surface, border: `1px solid ${c.border}`,
              borderRadius: '0.75rem', overflow: 'hidden',
              width: '9rem', display: 'inline-block', marginBottom: '2rem',
            }}>
              <div style={{
                background: `linear-gradient(160deg, #1a0d2e 0%, #0d1a2e 100%)`,
                height: '7.5rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: c.border, fontSize: '2.5rem',
              }}>
                <i className="fa-solid fa-dice" aria-hidden="true" />
              </div>
              <div style={{ padding: '0.625rem' }}>
                <div style={{ color: c.text, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.375rem', fontFamily: '"Geist Sans", system-ui, sans-serif' }}>Hero Realms</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginBottom: '0.375rem' }}>
                  {[
                    { icon: 'fa-users', label: '2 – 4 players' },
                    { icon: 'fa-clock', label: '20 min' },
                    { icon: 'fa-gauge', label: 'Easy' },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ color: c.muted, fontSize: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <i className={`fa-solid ${icon}`} aria-hidden="true" style={{ width: '0.75rem', color: c.cyan }} />
                      {label}
                    </div>
                  ))}
                </div>
                <span style={{ background: c.surface, color: c.purple, fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px' }}>Card Game</span>
              </div>
            </div>

            <p style={{ ...t.eyebrow, display: 'block', marginBottom: '0.75rem' }}>Form Elements</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '24rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', fontFamily: '"Geist Sans", system-ui, sans-serif' }}>
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search posts..."
                  readOnly
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem',
                    background: c.surfaceHigh, border: `1px solid ${c.border}`,
                    borderRadius: '0.375rem', color: c.text,
                    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label htmlFor="sg-select-difficulty" style={{ display: 'block', color: c.textSub, fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem', fontFamily: '"Geist Sans", system-ui, sans-serif' }}>
                  Select
                </label>
                <select id="sg-select-difficulty" style={{
                  width: '100%', padding: '0.5rem 0.75rem',
                  background: c.surfaceHigh, border: `1px solid ${c.border}`,
                  borderRadius: '0.375rem', color: c.text,
                  fontSize: '0.875rem', fontFamily: 'inherit',
                }}>
                  <option>Any difficulty</option>
                  <option>Easy</option>
                  <option>Moderate</option>
                </select>
              </div>
            </div>

          </div>
        ))}

        {/* ── IMAGE OVERLAY ── */}
        {section('Image Overlay', (
          <div>
            <p style={{ ...t.body, fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Synthwave gradient overlay on featured images — dark fade for legibility, with optional grid lines.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {/* Variant 1: Dark fade overlay */}
              <div style={{
                borderRadius: '0.75rem', overflow: 'hidden',
                width: '18rem', border: `1px solid ${c.border}`, flexShrink: 0,
              }}>
                <div style={{ position: 'relative', height: '10rem' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #2d0b4e 0%, #0b2d4e 50%, #1a0d2e 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(13,13,26,0.6) 60%, #13132b 100%)' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(${c.border}44 1px, transparent 1px), linear-gradient(90deg, ${c.border}44 1px, transparent 1px)`,
                    backgroundSize: '1.5rem 1.5rem',
                  }} />
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem' }}>
                    <div style={{ ...t.eyebrow, display: 'block', marginBottom: '0.25rem' }}>Music</div>
                    <div style={{ ...t.h2, fontSize: '0.9375rem', lineHeight: 1.3 }}>teh s3quence 016</div>
                  </div>
                </div>
                <div style={{ padding: '0.875rem', background: c.surface }}>
                  <p style={{ ...t.body, fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>Spring 2012 — tracks that hint of Summer to come.</p>
                </div>
              </div>

              {/* Variant 2: Hero with grid */}
              <div style={{
                borderRadius: '0.75rem', overflow: 'hidden',
                width: '18rem', border: `1px solid ${c.border}`, flexShrink: 0,
                position: 'relative', height: '10rem',
                background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `linear-gradient(${c.border}33 1px, transparent 1px), linear-gradient(90deg, ${c.border}33 1px, transparent 1px)`,
                  backgroundSize: '2rem 2rem',
                }} />
                <div style={{ position: 'absolute', inset: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ ...t.eyebrow, display: 'block', marginBottom: '0.375rem' }}>Featured</div>
                  <h3 style={{ ...t.h2, fontSize: '1.125rem', margin: '0 0 0.75rem' }}>Hero Realms</h3>
                  <button style={{ background: c.magenta, color: '#0d0d1a', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.875rem', fontWeight: 700, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', width: 'fit-content' }}>
                    View details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── GRADIENT / DECORATIVE ── */}
        {section('Gradient / Decorative', (
          <div>
            <div style={{
              borderRadius: '0.75rem', padding: '2rem',
              background: `linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)`,
              border: `1px solid ${c.border}`,
              position: 'relative', overflow: 'hidden', marginBottom: '1rem',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(${c.border}33 1px, transparent 1px), linear-gradient(90deg, ${c.border}33 1px, transparent 1px)`,
                backgroundSize: '2rem 2rem', pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative' }}>
                <div style={{ ...t.eyebrow, display: 'block', marginBottom: '0.5rem' }}>Featured</div>
                <h2 style={{ ...t.h2, marginBottom: '0.5rem' }}>teh s3quence 016</h2>
                <p style={{ ...t.body, marginBottom: '1rem', maxWidth: '40ch' }}>
                  Spring 2012 mix — tracks that hint of the Summer to come.
                </p>
                <button style={{ background: c.magenta, color: '#0d0d1a', border: 'none', borderRadius: '0.375rem', padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Listen now
                </button>
              </div>
            </div>
            <p style={{ ...t.meta }}>
              Retrowave grid overlay for hero sections, featured cards, and the homepage banner.
            </p>
          </div>
        ))}

      </main>

      {/* ── Footer ── */}
      <footer style={{
        background: '#0a0a18',
        borderTop: `1px solid ${c.border}`,
        padding: '2rem 1.5rem',
        marginTop: '4rem',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Personal site',  fa: 'fa-solid fa-link' },
              { label: 'Newsletter',     fa: 'fa-solid fa-envelope' },
              { label: 'Bluesky',        fa: 'fa-brands fa-bluesky' },
              { label: 'GitHub',         fa: 'fa-brands fa-github' },
              { label: 'Instagram',      fa: 'fa-brands fa-instagram' },
              { label: 'Spotify',        fa: 'fa-brands fa-spotify' },
              { label: 'LinkedIn',       fa: 'fa-brands fa-linkedin' },
              { label: 'YouTube',        fa: 'fa-brands fa-youtube' },
              { label: 'Bandcamp',       fa: 'fa-brands fa-bandcamp' },
              { label: 'SoundCloud',     fa: 'fa-brands fa-soundcloud' },
              { label: 'Twitch',         fa: 'fa-brands fa-twitch' },
              { label: 'Mastodon',       fa: 'fa-brands fa-mastodon' },
              { label: 'WordPress.org',  fa: 'fa-brands fa-wordpress' },
              { label: 'Etsy',           fa: 'fa-brands fa-etsy' },
            ].map(({ label, fa }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                title={label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '2.25rem', height: '2.25rem',
                  background: c.surfaceHigh, border: `1px solid ${c.border}`,
                  borderRadius: '0.375rem', color: c.muted,
                  textDecoration: 'none', fontSize: '1rem',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = c.cyan
                  e.currentTarget.style.color = c.cyan
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = c.border
                  e.currentTarget.style.color = c.muted
                }}
              >
                <i className={fa} aria-hidden="true" />
              </a>
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '1rem', borderTop: `1px solid ${c.border}`,
          }}>
            <span style={{ fontFamily: '"Victor Mono", monospace', color: c.cyan, fontWeight: 700, fontSize: '0.875rem' }}>
              jazzsequence
            </span>
            <span style={{ ...t.meta, fontSize: '0.8125rem' }}>© 2026 Chris Reynolds</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
