import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/tests/e2e/**', // Exclude Playwright E2E tests from Vitest
      '**/.claude/worktrees/**', // Exclude git worktrees from test runs
    ],
    css: false, // Disable CSS processing to avoid ESM issues with Tailwind
    server: {
      deps: {
        inline: [/@csstools/, /@asamuzakjp/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        '.next/',
        'coverage/',
      ],
    },
  },
  resolve: {
    alias: {
      // import.meta.dirname, not __dirname: Vite's `configLoader: 'native'` does not
      // provide __dirname and is planned to become the default, which warned on every run.
      '@/app': path.resolve(import.meta.dirname, '../app'),
      '@': path.resolve(import.meta.dirname, '../src'),
    },
  },
})
