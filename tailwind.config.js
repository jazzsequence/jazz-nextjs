/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:          '#0d0d1a',
          surface:     '#13132b',
          'surface-high': '#1c1c3a',
          border:      '#2a2a4a',
          'border-bright': '#3d3d6b',
          text:        '#f0eeff',
          'text-sub':  '#c4c0e0',
          muted:       '#a09abb',
          cyan:        '#00e5cc',
          magenta:     '#ff2d78',
          purple:      '#9d5cff',
          header:      '#0a0a18',
        },
      },
      fontFamily: {
        // Victor Mono — site title, H2 headings, code, eyebrow labels
        mono: ['"Victor Mono"', 'monospace'],
        // Space Grotesk — body prose
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        // Geist Sans — H1, H3, H4, UI labels, meta text
        heading: ['"Geist Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Slightly larger body base than Tailwind default (1rem)
        base: ['1.1rem', { lineHeight: '1.75' }],
      },
    },
  },
  plugins: [],
}

export default config
