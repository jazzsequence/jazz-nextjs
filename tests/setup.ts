import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { server } from './mocks/server'
import { resetRateLimiter } from '../src/lib/wordpress/client'

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
