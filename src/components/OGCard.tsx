/**
 * OGCard — the visual design for the homepage Open Graph image.
 *
 * Rendered by app/opengraph-image.tsx via Next.js Satori (ImageResponse).
 * Also used in Storybook for design iteration at the exact 1200×630 viewport.
 *
 * Satori constraints: inline styles only, no CSS classes, no Tailwind,
 * no pseudo-elements, no CSS variables. All values must be explicit px/string.
 * Victor Mono is loaded explicitly in opengraph-image.tsx and passed to ImageResponse.
 */

// Brand colors matching tailwind.config.js and globals.css tokens exactly
export const OG_COLORS = {
  // Body gradient (matches globals.css body background, slightly stronger for OG)
  gradientTop: '#260d1b',    // dark magenta-dusk — pushed slightly for OG readability
  gradientMid: '#0d0d1a',    // brand bg
  gradientBot: '#06060f',    // near-black
  // Design tokens
  surface: '#13132b',
  surfaceHigh: '#1c1c3a',
  border: '#2a2a4a',
  borderBright: '#3d3d6b',
  text: '#f0eeff',
  textSub: '#c4c0e0',
  muted: '#a09abb',
  cyan: '#00e5cc',
  magenta: '#ff2d78',
  purple: '#9d5cff',
}

export const OG_SIZE = { width: 1200, height: 630 }

interface OGCardProps {
  /** Site tagline from WordPress — fetched at generation time. */
  tagline?: string
}

export default function OGCard({ tagline = 'I make websites and things' }: OGCardProps) {
  return (
    <div
      style={{
        width: `${OG_SIZE.width}px`,
        height: `${OG_SIZE.height}px`,
        // Retrowave dusk gradient — matches actual site body background
        background: `linear-gradient(180deg, ${OG_COLORS.gradientTop} 0%, ${OG_COLORS.gradientMid} 55%, ${OG_COLORS.gradientBot} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Victor Mono", monospace',
      }}
    >
      {/* Background grid — retrowave grid, uses brighter border token at higher opacity */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${OG_COLORS.borderBright} 1px, transparent 1px), linear-gradient(90deg, ${OG_COLORS.borderBright} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          opacity: 0.45,
          display: 'flex',
        }}
      />

      {/* Magenta dusk glow — upper left, mirrors the body gradient hue */}
      <div
        style={{
          position: 'absolute',
          top: '-180px',
          left: '-80px',
          width: '560px',
          height: '560px',
          background: OG_COLORS.magenta,
          borderRadius: '50%',
          opacity: 0.12,
          filter: 'blur(100px)',
          display: 'flex',
        }}
      />

      {/* Cyan glow — lower right */}
      <div
        style={{
          position: 'absolute',
          bottom: '-180px',
          right: '-80px',
          width: '520px',
          height: '520px',
          background: OG_COLORS.cyan,
          borderRadius: '50%',
          opacity: 0.09,
          filter: 'blur(100px)',
          display: 'flex',
        }}
      />

      {/* Border frame */}
      <div
        style={{
          position: 'absolute',
          inset: '28px',
          border: `1px solid ${OG_COLORS.border}`,
          borderRadius: '12px',
          display: 'flex',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px',
          zIndex: 1,
          padding: '48px',
        }}
      >
        {/* Site name — neon-text treatment: cyan with multi-layer text-shadow glow */}
        <div
          style={{
            fontSize: '96px',
            fontWeight: 700,
            color: OG_COLORS.cyan,
            letterSpacing: '-3px',
            lineHeight: 1,
            fontFamily: '"Victor Mono", monospace',
            // Neon glow matching .neon-text CSS, spreads scaled ~5× for 96px text
            // (nav title is ~18px with 6/14/28px spreads → 96px needs ~30/70/140px)
            textShadow: [
              `0 0 30px ${OG_COLORS.cyan}`,
              `0 0 70px rgba(0,229,204,0.7)`,
              `0 0 140px rgba(0,229,204,0.4)`,
            ].join(', '),
          }}
        >
          jazzsequence
        </div>

        {/* Divider — cyan-to-purple gradient matching the design system */}
        <div
          style={{
            width: '420px',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${OG_COLORS.purple}, ${OG_COLORS.cyan}, transparent)`,
            display: 'flex',
          }}
        />

        {/* Tagline — actual WordPress site description */}
        <div
          style={{
            fontSize: '28px',
            color: OG_COLORS.textSub,
            fontFamily: '"Victor Mono", monospace',
            fontWeight: 400,
            letterSpacing: '0.05em',
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>
      </div>
    </div>
  )
}
