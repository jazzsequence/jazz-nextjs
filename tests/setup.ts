import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import { server } from './mocks/server'
import { resetRateLimiter } from '../src/lib/wordpress/client'

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
