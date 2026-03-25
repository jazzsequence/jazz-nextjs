import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { server } from './mocks/server'
import { resetRateLimiter } from '../src/lib/wordpress/client'

// Suppress known noisy-but-correct stderr output in the test environment.
//
// happy-dom writes DOMExceptions directly to process.stderr when a script element
// with an external src is appended — it can't load external URLs and logs the
// failure at the fd level, bypassing both console.error and Node's unhandledRejection
// event. SocialScriptLoader's try/catch handles the thrown exception correctly, but
// the stderr write already happened before the catch runs.
//
// [Zod Validation Error] is intentional logging in the WordPress client that fires
// when tests deliberately pass invalid data to verify schema rejection.
// console.error is intercepted by vitest (doesn't go through process.stderr.write).
// Filter patterns that are correct behavior, not bugs:
//   [Zod Validation Error]: WordPress client logs schema failures in tests that
//   deliberately pass invalid data.
//   [Page Fetch Error]: page route logs 404/error cases in tests that verify
//   error handling.
const _origConsoleError = console.error
console.error = (...args: Parameters<typeof console.error>) => {
  const msg = String(args[0] ?? '')
  if (msg.includes('[Zod Validation Error]')) return
  if (msg.includes('[Page Fetch Error]')) return // also matches [Child Page Fetch Error]
  // React warning from Next.js Image mock passing `layout` as a non-boolean DOM attr
  if (msg.includes('non-boolean attribute')) return
  _origConsoleError(...args)
}

const _origStderrWrite = process.stderr.write.bind(process.stderr)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(process.stderr as any).write = (data: string | Uint8Array, ...args: any[]): boolean => {
  const msg = typeof data === 'string' ? data : Buffer.from(data).toString('utf8')
  if (msg.includes('JavaScript file loading is disabled')) return true
  // MSW aborts in-flight fetch requests on cleanup; happy-dom surfaces these as
  // AbortError/NetworkError DOMExceptions written directly to stderr.
  if (msg.includes('[AbortError]') || msg.includes('[NetworkError]')) return true
  return _origStderrWrite(data, ...args)
}

// Mock Next.js Image and Link components
vi.mock('next/image', async () => {
  const mocks = await import('./mocks/next')
  return {
    default: mocks.Image,
  }
})

vi.mock('next/link', async () => {
  const mocks = await import('./mocks/next')
  return {
    default: mocks.Link,
  }
})

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock DOMPurify for Node.js environment
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string) => html, // Pass through HTML in tests
  },
}))

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
  resetRateLimiter()
  cleanup()
  vi.restoreAllMocks()
})

// Clean up after the tests are finished
afterAll(() => {
  server.close()
})
