import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    // Under msw 3 in happy-dom, a cross-origin request through happy-dom's fetch reaches msw as
    // an unhandled OPTIONS request (its CORS preflight) and is then blocked, and `global.fetch`
    // is read-only. Server-side tests run in `node`, where neither happens. See `projects` below.
    // Iframe pages are not loaded: with them on, the media page tests (real iframe URLs) raised
    // uncaught getALPNNegotiatedProtocol errors from inside @mswjs/interceptors.
    environmentOptions: { happyDOM: { settings: { disableIframePageLoading: true } } },
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
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['tests/app/api/**/*.test.ts', 'tests/lib/wordpress/**/*.test.ts', 'tests/scripts/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          include: ['tests/**/*.test.{ts,tsx}'],
          exclude: [
            '**/node_modules/**',
            '**/.next/**',
            '**/tests/e2e/**',
            '**/.claude/worktrees/**',
            'tests/app/api/**',
            'tests/lib/wordpress/**',
            'tests/scripts/**',
          ],
        },
      },
    ],
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
