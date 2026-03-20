import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'
// Self-hosted fonts (same as layout.tsx)
import '@fontsource/victor-mono/400.css'
import '@fontsource/victor-mono/400-italic.css'
import '@fontsource/victor-mono/700.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'

const preview: Preview = {
  parameters: {
    // Default dark background matching --color-bg
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0d0d1a' },
        { name: 'surface', value: '#13132b' },
      ],
    },

    // Viewport presets
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
      defaultViewport: 'desktop',
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // a11y: 'error' = fail CI on WCAG violations
    // Every component story is an a11y gate
    a11y: {
      test: 'error',
    },

    layout: 'padded',
  },

  // Apply dark background to all stories via class on the root
  decorators: [
    (Story) => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.colorScheme = 'dark'
      }
      return Story()
    },
  ],
}

export default preview
