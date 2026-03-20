import type { StorybookConfig } from '@storybook/nextjs-vite'
import { fileURLToPath } from 'url'
import path from 'path'

// ESM-compatible __dirname (package.json has "type": "module")
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextImageMock = path.resolve(__dirname, './__mocks__/NextImage.tsx')

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook',
    '@storybook/addon-onboarding',
  ],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],

  viteFinal: async (viteConfig) => {
    viteConfig.resolve = viteConfig.resolve ?? {}

    // Normalise existing aliases to array form so we can prepend ours.
    // Our entry must come FIRST so it takes precedence over @storybook/nextjs-vite's own next/image handling.
    const existing = viteConfig.resolve.alias ?? []
    const existingArr = Array.isArray(existing)
      ? existing
      : Object.entries(existing).map(([find, replacement]) => ({ find, replacement }))

    viteConfig.resolve.alias = [
      { find: /^next\/image$/, replacement: nextImageMock },
      ...existingArr,
    ]

    return viteConfig
  },
}

export default config
