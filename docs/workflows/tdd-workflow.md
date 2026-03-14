# Test-Driven Development (TDD) Workflow

**This project follows TDD London School (mockist approach) - ALWAYS write tests BEFORE implementing functionality.**

## TDD Methodology

### London School Approach

1. **Write tests FIRST**, then implement code
2. **Mock external dependencies** (WordPress API, databases)
3. **Focus on behavior** over implementation
4. **Maintain high test coverage**

### Red-Green-Refactor Cycle

```bash
# TDD Workflow (London School - Mock-first)
1. Write failing test first
2. Run test to confirm it fails: npm test -- --run
3. Implement minimal code to pass test
4. Run test to confirm it passes
5. Refactor if needed
6. Repeat
```

## Pre-Commit Requirements

**NEVER commit code without:**
- ✅ Tests written first
- ✅ All tests passing (176+ unit tests)
- ✅ ESLint clean
- ✅ E2E tests passing (16+ tests)

## Test Commands

```bash
# Unit tests (watch mode)
npm test

# Unit tests (run once)
npm test -- --run

# With UI
npm run test:ui

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui

# E2E against standalone build (production mode)
npm run test:e2e:standalone

# Test standalone build locally
npm run start:test

# Coverage
npm test -- --coverage
```

## Test Infrastructure

### Unit & Integration Tests

**Framework**: Vitest 4.0.18 with happy-dom

**Configuration**: `config/vitest.config.ts`

**Key Features**:
- TypeScript support
- React component testing
- MSW for API mocking
- Coverage reporting with v8

### End-to-End Tests

**Framework**: Playwright 1.58.2

**Configuration**: `config/playwright.config.ts`

**Key Features**:
- Multi-browser testing
- Visual regression testing
- Network interception

## Why E2E Tests Are Mandatory

E2E tests catch runtime errors that unit tests miss:
- Next.js routing conflicts (different dynamic segment names)
- Server startup failures
- Integration issues between components
- Cache invalidation bugs
- Production-mode behavior

**Real example**: The routing conflict bug passed:
- ✅ Unit tests (271/271 passing)
- ✅ Linter (0 errors)
- ✅ Build (successful)
- ❌ **E2E tests would have caught:** Server crashed on startup

## Test File Structure

```
src/
├── lib/
│   └── wordpress/
│       ├── types.ts
│       ├── types.test.ts      # Unit tests for types
│       ├── client.ts
│       └── client.test.ts     # Unit tests for API client
tests/
├── setup.ts                    # Global test setup
└── mocks/
    ├── handlers.ts             # MSW request handlers
    ├── server.ts               # MSW server setup
    └── wordpress-data.ts       # Mock WordPress data
```

## Test Naming Convention

- Test files: `*.test.ts` or `*.spec.ts`
- Describe blocks: Use the component/function name
- Test cases: Use "should" statements

```typescript
describe('WPPost', () => {
  it('should accept a valid post object', () => {
    // Test implementation
  })

  it('should enforce type literal for post type', () => {
    // Test implementation
  })
})
```

## Mocking API Calls

Use MSW (Mock Service Worker) for API mocking:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://api.example.com/posts', () => {
    return HttpResponse.json({ posts: mockPosts })
  }),
]
```

## Testing React Components

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import PostCard from './PostCard'

describe('PostCard', () => {
  it('should render post title', () => {
    render(<PostCard post={mockPost} />)
    expect(screen.getByText('Test Post')).toBeInTheDocument()
  })
})
```

## Coverage Requirements

Aim for:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

Critical paths (auth, payments, data mutations) should have 100% coverage.

## Error Handling in Tests

### Production Build Considerations

When testing code that runs in standalone builds (production mode), be aware of error handling differences:

**Development/Test Environment**:
```typescript
if (error instanceof WPAPIError) {
  // Works in dev and unit tests
}
```

**Production Standalone Build**:
```typescript
if (error.name === 'WPAPIError') {
  // More reliable in production builds
  // instanceof may not work due to bundling/minification
}
```

**Best Practice**: Use `error.name` checks instead of `instanceof` for error type detection.

## Standalone Build Testing

The `npm run start:test` command builds and tests the standalone production build locally:
- Builds with `npm run build`
- Starts standalone server on port 3000
- Runs E2E tests against localhost:3000
- Simulates Pantheon production environment
- Essential for testing production-specific behaviors

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **One Assertion Per Test**: Focus on single behavior
3. **Descriptive Names**: Test names should explain what they verify
4. **Setup/Teardown**: Use beforeEach/afterEach for common setup
5. **Avoid Implementation Details**: Test behavior, not internals
6. **Keep Tests Fast**: Mock slow operations (network, database)
7. **Update Tests with Code**: When code changes, update tests immediately
8. **Test Standalone Builds**: Use `npm run start:test` to verify production behavior
9. **Use `error.name` for Error Type Checking**: More reliable than `instanceof` in production

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [MSW Documentation](https://mswjs.io)
- [Playwright Documentation](https://playwright.dev)
- [TDD London School](https://www.thoughtworks.com/insights/blog/mockists-are-dead-long-live-classicists)

See `docs/TESTING.md` for complete testing guide.
