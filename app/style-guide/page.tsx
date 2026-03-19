'use client'

/**
 * Design System Style Guide
 *
 * Preview page for the proposed retrowave/synthwave dark theme.
 * Self-contained — all styles inline so it works before global theme is applied.
 * Not linked from navigation; access directly at /style-guide.
 *
 * 'use client' required for hover event handlers on interactive preview elements.
 */

import Link from 'next/link'

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

const swatch = (color: string, name: string, hex: string, contrast: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
    <div style={{
      width: '3rem', height: '3rem', borderRadius: '0.375rem',
      background: color, border: `1px solid ${c.border}`, flexShrink: 0,
    }} />
    <div>
      <div style={{ color: c.text, fontWeight: 600, fontSize: '0.875rem' }}>{name}</div>
      <div style={{ color: c.muted, fontSize: '0.75rem', fontFamily: 'monospace' }}>{hex}</div>
      <div style={{ color: c.muted, fontSize: '0.75rem' }}>Contrast on bg: <span style={{ color: c.cyan }}>{contrast}</span></div>
    </div>
  </div>
)

const section = (title: string, children: React.ReactNode) => (
  <section style={{ marginBottom: '3rem' }}>
    <h2 style={{
      color: c.cyan,
      fontSize: '0.75rem',
      fontFamily: 'monospace',
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      marginBottom: '1.5rem',
      paddingBottom: '0.5rem',
      borderBottom: `1px solid ${c.border}`,
    }}>
      {title}
    </h2>
    {children}
  </section>
)

export default function StyleGuidePage() {
  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.text, fontFamily: 'Geist, sans-serif' }}>

      {/* ── Sticky Header Preview ── */}
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
          {/* Site title — monospace / tech font */}
          <Link href="/" style={{
            fontFamily: '"Geist Mono", "Fira Code", "JetBrains Mono", monospace',
            fontWeight: 700,
            fontSize: '1.125rem',
            color: c.cyan,
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}>
            jazzsequence
          </Link>
          {/* Nav links */}
          <nav aria-label="Main navigation">
            <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
              {['Posts', 'Games', 'Music', 'About'].map((item) => (
                <li key={item}>
                  <a href="#" style={{
                    color: c.textSub,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
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

        <h1 style={{
          fontSize: '2rem', fontWeight: 700,
          color: c.text, marginBottom: '0.5rem',
        }}>
          Style Guide
        </h1>
        <p style={{ color: c.muted, marginBottom: '3rem', fontSize: '0.9375rem' }}>
          Retrowave / Synthwave dark theme proposal for jazzsequence.com
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
            {swatch(c.magenta,    'Accent Magenta',  '#ff2d78', '5.5:1 AA')}
            {swatch(c.purple,     'Accent Purple',   '#9d5cff', '5.2:1 AA')}
          </div>
        ))}

        {/* ── TYPOGRAPHY ── */}
        {section('Typography', (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ color: c.text, fontSize: '2.5rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                Heading 1 — 2.5rem / 700
              </h1>
              <h2 style={{ color: c.text, fontSize: '2rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
                Heading 2 — 2rem / 700
              </h2>
              <h3 style={{ color: c.text, fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
                Heading 3 — 1.5rem / 600
              </h3>
              <h4 style={{ color: c.textSub, fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
                Heading 4 — 1.125rem / 600
              </h4>
            </div>
            <p style={{ color: c.text, fontSize: '1rem', lineHeight: 1.75, marginBottom: '1rem', maxWidth: '60ch' }}>
              Body text — 1rem / 1.75 line-height. The quick brown fox jumps over the lazy dog.
              Jazzsequence.com is a personal site covering music, games, writing, and tech.
            </p>
            <p style={{ color: c.muted, fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem', maxWidth: '60ch' }}>
              Muted / meta text — 0.875rem. Published January 1, 2026 · 5 min read
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
              fontSize: '0.875rem', fontFamily: 'monospace',
            }}>
              inline code example
            </code>
          </div>
        ))}

        {/* ── COMPONENTS ── */}
        {section('Components', (
          <div>

            {/* Buttons */}
            <p style={{ color: c.muted, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Buttons</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <button style={{
                background: c.cyan, color: '#0d0d1a',
                border: 'none', borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 700,
                fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                Primary (Cyan)
              </button>
              <button style={{
                background: 'transparent', color: c.cyan,
                border: `1px solid ${c.cyan}`, borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 600,
                fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                Outline
              </button>
              <button style={{
                background: c.magenta, color: '#fff',
                border: 'none', borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 700,
                fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                Accent (Magenta)
              </button>
              <button style={{
                background: c.surfaceHigh, color: c.textSub,
                border: `1px solid ${c.border}`, borderRadius: '0.375rem',
                padding: '0.5rem 1.25rem', fontWeight: 500,
                fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                Ghost
              </button>
            </div>

            {/* Tags / Badges */}
            <p style={{ color: c.muted, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Tags / Badges</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              {['synthwave', 'music', 'card game', 'teh s3quence'].map(tag => (
                <span key={tag} style={{
                  background: c.surfaceHigh,
                  color: c.cyan,
                  border: `1px solid ${c.border}`,
                  borderRadius: '9999px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Post card */}
            <p style={{ color: c.muted, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Post Card</p>
            <div style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '0.75rem',
              overflow: 'hidden',
              maxWidth: '28rem',
              marginBottom: '2rem',
            }}>
              <div style={{ background: `linear-gradient(135deg, ${c.surfaceHigh} 0%, #1a0d2e 100%)`, height: '8rem' }} />
              <div style={{ padding: '1.25rem' }}>
                <div style={{ color: c.muted, fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  March 19, 2026 · 4 min read
                </div>
                <h3 style={{ color: c.text, fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  teh s3quence 016 — spring mix
                </h3>
                <p style={{ color: c.textSub, fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  After a seemingly long winter, Spring is here again. A collection of tracks hinting at the Summer to come.
                </p>
                <a href="#" style={{ color: c.cyan, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  Read more →
                </a>
              </div>
            </div>

            {/* Game card */}
            <p style={{ color: c.muted, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Game Card</p>
            <div style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '0.75rem',
              overflow: 'hidden',
              width: '9rem',
              display: 'inline-block',
              marginBottom: '2rem',
            }}>
              <div style={{
                background: `linear-gradient(160deg, #1a0d2e 0%, #0d1a2e 100%)`,
                height: '7.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem',
              }}>
                🎲
              </div>
              <div style={{ padding: '0.625rem' }}>
                <div style={{ color: c.text, fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Hero Realms</div>
                <div style={{ color: c.muted, fontSize: '0.6875rem' }}>2 – 4 players · 20 min</div>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                  <span style={{ background: c.surfaceHigh, color: c.purple, fontSize: '0.625rem', padding: '0.125rem 0.375rem', borderRadius: '9999px' }}>Card Game</span>
                </div>
              </div>
            </div>

            {/* Input */}
            <p style={{ color: c.muted, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Form Elements</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '24rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search posts..."
                  readOnly
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem',
                    background: c.surfaceHigh,
                    border: `1px solid ${c.border}`,
                    borderRadius: '0.375rem',
                    color: c.text, fontSize: '0.875rem',
                    outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: c.textSub, fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                  Select
                </label>
                <select style={{
                  width: '100%', padding: '0.5rem 0.75rem',
                  background: c.surfaceHigh,
                  border: `1px solid ${c.border}`,
                  borderRadius: '0.375rem',
                  color: c.text, fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}>
                  <option>Any difficulty</option>
                  <option>Easy</option>
                  <option>Moderate</option>
                </select>
              </div>
            </div>

          </div>
        ))}

        {/* ── SYNTHWAVE GRADIENT PREVIEW ── */}
        {section('Gradient / Decorative', (
          <div>
            <div style={{
              borderRadius: '0.75rem',
              padding: '2rem',
              background: `linear-gradient(135deg, #0d0d1a 0%, #1a0d2e 40%, #0d1a2e 100%)`,
              border: `1px solid ${c.border}`,
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '1rem',
            }}>
              {/* Faint grid lines — retrowave aesthetic */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(${c.border}33 1px, transparent 1px), linear-gradient(90deg, ${c.border}33 1px, transparent 1px)`,
                backgroundSize: '2rem 2rem',
                pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative' }}>
                <div style={{
                  color: c.cyan, fontSize: '0.75rem', fontFamily: 'monospace',
                  letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem',
                }}>
                  Featured
                </div>
                <h2 style={{ color: c.text, fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  teh s3quence 016
                </h2>
                <p style={{ color: c.textSub, marginBottom: '1rem', maxWidth: '40ch' }}>
                  Spring 2012 mix — tracks that hint of the Summer to come.
                </p>
                <button style={{
                  background: c.magenta, color: '#fff',
                  border: 'none', borderRadius: '0.375rem',
                  padding: '0.5rem 1.25rem', fontWeight: 700,
                  fontSize: '0.875rem', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  Listen now
                </button>
              </div>
            </div>
            <p style={{ color: c.muted, fontSize: '0.8125rem' }}>
              The retrowave grid overlay can be used on hero sections, featured cards, or the homepage banner.
            </p>
          </div>
        ))}

      </main>

      {/* ── Footer Preview ── */}
      <footer style={{
        background: '#0a0a18',
        borderTop: `1px solid ${c.border}`,
        padding: '2rem 1.5rem',
        marginTop: '4rem',
      }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {/* Social links */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { label: 'Personal site', icon: '🔗', href: 'https://chrisreynolds.io' },
              { label: 'Newsletter', icon: '✉️', href: '#' },
              { label: 'Bluesky', icon: '🦋', href: 'https://bsky.app/profile/jazzsequence.com' },
              { label: 'GitHub', icon: '🐙', href: 'https://github.com/jazzsequence' },
              { label: 'Instagram', icon: '📷', href: '#' },
              { label: 'Spotify', icon: '🎵', href: '#' },
              { label: 'LinkedIn', icon: '💼', href: '#' },
              { label: 'YouTube', icon: '▶️', href: '#' },
              { label: 'Bandcamp', icon: '🎸', href: '#' },
              { label: 'SoundCloud', icon: '☁️', href: '#' },
              { label: 'Twitch', icon: '📺', href: '#' },
              { label: 'Mastodon', icon: '🐘', href: '#' },
              { label: 'WordPress', icon: '⓪', href: '#' },
              { label: 'Etsy', icon: '🛍️', href: '#' },
            ].map(({ label, icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                title={label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '2.25rem', height: '2.25rem',
                  background: c.surfaceHigh,
                  border: `1px solid ${c.border}`,
                  borderRadius: '0.375rem',
                  color: c.muted,
                  textDecoration: 'none',
                  fontSize: '1rem',
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
                {icon}
              </a>
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: '1rem', borderTop: `1px solid ${c.border}`,
          }}>
            <span style={{
              fontFamily: '"Geist Mono", monospace',
              color: c.cyan, fontWeight: 700, fontSize: '0.875rem',
            }}>
              jazzsequence
            </span>
            <span style={{ color: c.muted, fontSize: '0.8125rem' }}>
              © 2026 Chris Reynolds
            </span>
          </div>
        </div>
      </footer>

    </div>
  )
}
