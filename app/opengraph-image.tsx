import { ImageResponse } from 'next/og'

export const dynamic = 'force-dynamic'
export const alt = 'jazzsequence.com'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Brand colors from tailwind.config.js
const colors = {
  bg: '#0d0d1a',
  surface: '#13132b',
  surfaceHigh: '#1c1c3a',
  border: '#2a2a4a',
  text: '#f0eeff',
  textSub: '#c4c0e0',
  cyan: '#00e5cc',
  magenta: '#ff2d78',
  purple: '#9d5cff',
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: colors.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid accent */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${colors.border} 1px, transparent 1px), linear-gradient(90deg, ${colors.border} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            opacity: 0.4,
          }}
        />

        {/* Glow accents */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            left: '-120px',
            width: '500px',
            height: '500px',
            background: colors.purple,
            borderRadius: '50%',
            opacity: 0.12,
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-120px',
            right: '-120px',
            width: '500px',
            height: '500px',
            background: colors.cyan,
            borderRadius: '50%',
            opacity: 0.1,
            filter: 'blur(80px)',
          }}
        />

        {/* Border frame */}
        <div
          style={{
            position: 'absolute',
            inset: '24px',
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            zIndex: 1,
            padding: '48px',
          }}
        >
          {/* Site name */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '-2px',
              lineHeight: 1,
              fontFamily: 'monospace',
            }}
          >
            jazzsequence
            <span style={{ color: colors.cyan }}>.</span>
            <span style={{ color: colors.magenta }}>com</span>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '320px',
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${colors.purple}, ${colors.cyan}, transparent)`,
              margin: '8px 0',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: '28px',
              color: colors.textSub,
              fontFamily: 'sans-serif',
              fontWeight: 400,
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}
          >
            music · code · whatever
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
