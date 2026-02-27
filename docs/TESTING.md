# Testing Guide

This document describes the testing strategy and infrastructure for the jazz-nextjs project.

## Testing Philosophy

We follow **TDD London School** (mockist approach):
- Write tests FIRST, then implement code
- Mock external dependencies (WordPress API, databases)
- Focus on behavior over implementation
- Maintain high test coverage

## Test Infrastructure

### Unit & Integration Tests (Vitest)

**Framework**: Vitest 4.0.18 with happy-dom

**Configuration**: `config/vitest.config.ts`

**Key Features**:
- TypeScript support
- React component testing
- MSW for API mocking
- Coverage reporting with v8

### End-to-End Tests (Playwright)

**Framework**: Playwright 1.58.2

**Configuration**: `config/playwright.config.ts`

**Key Features**:
- Multi-browser testing
- Visual regression testing
- Network interception

### Test Environment

**happy-dom** instead of jsdom:
- Lightweight DOM implementation
- Better ESM compatibility
- Faster test execution
- No CSS parsing issues

## Running Tests

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

# Coverage
npm test -- --coverage
```

## Writing Tests

### Test File Structure

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

### Test Naming Convention

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

### Mocking API Calls

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

### Testing React Components

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

## Test Data

Mock data is stored in `tests/mocks/wordpress-data.ts`:

```typescript
export const mockPost: WPPost = {
  id: 1,
  title: { rendered: 'Test Post' },
  content: { rendered: '<p>Content</p>' },
  // ... other fields
}
```

Keep mock data:
- Realistic and representative
- Type-safe (use actual TypeScript types)
- Reusable across multiple tests
- Documented with comments if complex

## TDD Workflow

### 1. Red Phase (Write Failing Test)

```typescript
describe('fetchPost', () => {
  it('should fetch a post by slug', async () => {
    const post = await fetchPost('test-post')
    expect(post.slug).toBe('test-post')
  })
})
```

**Run test**: `npm test` → Fails (function doesn't exist yet)

### 2. Green Phase (Make It Pass)

```typescript
export async function fetchPost(slug: string): Promise<WPPost> {
  const res = await fetch(`${API_URL}/posts?slug=${slug}`)
  const data = await res.json()
  return data[0]
}
```

**Run test**: `npm test` → Passes

### 3. Refactor Phase (Improve Code)

```typescript
export async function fetchPost(slug: string): Promise<WPPost> {
  const res = await fetch(`${API_URL}/posts?slug=${slug}`)
  if (!res.ok) throw new Error(`Failed to fetch post: ${res.statusText}`)

  const data = await res.json()
  if (!data.length) throw new Error(`Post not found: ${slug}`)

  return postSchema.parse(data[0]) // Add Zod validation
}
```

**Run test**: `npm test` → Still passes, code is better

## Continuous Testing

Tests run automatically:
- **Pre-commit**: Via git hooks (if configured)
- **PR checks**: GitHub Actions run full test suite
- **Build process**: Pantheon runs tests before deployment

## Debugging Tests

### VS Code Integration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test", "--", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Vitest UI

```bash
npm run test:ui
```

Opens browser interface for:
- Test results visualization
- Coverage reports
- File-by-file test breakdown

### Common Issues

**ESM Module Errors**:
- Ensure `"type": "module"` in package.json
- Check vitest.config.ts for proper module handling

**DOM Not Available**:
- Verify `environment: 'happy-dom'` in config
- Check test imports `@testing-library/react`

**Mock Not Working**:
- MSW server started in setup.ts
- Handlers registered correctly
- URL matches exactly (including trailing slashes)

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **One Assertion Per Test**: Focus on single behavior
3. **Descriptive Names**: Test names should explain what they verify
4. **Setup/Teardown**: Use beforeEach/afterEach for common setup
5. **Avoid Implementation Details**: Test behavior, not internals
6. **Keep Tests Fast**: Mock slow operations (network, database)
7. **Update Tests with Code**: When code changes, update tests immediately

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [MSW Documentation](https://mswjs.io)
- [Playwright Documentation](https://playwright.dev)
- [TDD London School](https://www.thoughtworks.com/insights/blog/mockists-are-dead-long-live-classicists)

## Last Updated

2026-02-26
