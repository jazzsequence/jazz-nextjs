# Playwright E2E Test Hang Analysis

**Date**: 2026-03-04
**Environment**: GitHub Actions CI
**Status**: CRITICAL - Tests hang before execution
**Last Working**: Commit 7e67de5

## Symptoms

- Tests display "Running 87 tests using 2 workers" then hang indefinitely
- No test execution begins
- Timeout occurs after 10+ minutes
- Works perfectly locally (87 tests, ~30 seconds)
- Site IS accessible and serving traffic at `https://dev-jazz-nextjs15.pantheonsite.io`

## Root Cause Analysis

### Primary Issue: `networkidle` Wait State in Pantheon Standalone Build

The hang is caused by **extensive use of `networkidle` wait state** (44 occurrences across test files) combined with a **Next.js standalone build deployed to Pantheon**. This creates a perfect storm:

1. **Next.js Standalone Build Behavior**
   - `output: "standalone"` (required for Pantheon)
   - Server-side rendering with streaming responses
   - Persistent connections for hydration
   - Background ISR processes may keep connections open

2. **networkidle Definition**
   - Playwright waits for NO network activity for 500ms
   - "No more than 2 network connections for at least 500ms"
   - In a production deployment with ISR, this may NEVER occur

3. **Pantheon-Specific Factors**
   - Custom cache handler: `./cacheHandler.mjs`
   - CDN image optimization from DigitalOcean Spaces
   - Persistent cache connections
   - Build info may make additional requests

4. **Why It Works Locally**
   - Dev server (`npm run dev`) has different network characteristics
   - No CDN/cache handler complexity
   - Faster network resolution
   - No production optimizations that keep connections open

### Evidence from Code Changes

**Since last working commit (7e67de5):**
```diff
+ 44 new instances of `await page.waitForLoadState('networkidle')`
+ greeting.spec.ts (20 tests) - NEW FILE with query params
+ images.spec.ts (multiple networkidle waits) - NEW FILE
+ homepage.spec.ts - Changed from simple heading check to complex greeting validation
```

**Test count increase:**
- Last working: ~60 tests
- Current: 87 tests (+27 tests)
- All new tests use `networkidle`

## Secondary Issues

### 1. Missing Global Timeout Configuration

The Playwright config has **NO global timeout settings**:

```typescript
// config/playwright.config.ts - MISSING TIMEOUTS
export default defineConfig({
  testDir: '../tests/e2e',
  fullyParallel: true,
  // ❌ NO timeout configuration
  // ❌ NO expect.timeout
  // ❌ NO actionTimeout
  // ❌ NO navigationTimeout
})
```

**Recommended defaults for CI:**
```typescript
timeout: 30000, // 30s per test
expect: { timeout: 10000 }, // 10s per assertion
use: {
  actionTimeout: 10000, // 10s per action
  navigationTimeout: 30000, // 30s for page.goto
}
```

### 2. Browser Launch in CI Environment

No explicit browser launch configuration for headless CI:
```typescript
// MISSING in use: {}
headless: true, // Explicit for CI
launchOptions: {
  args: [
    '--disable-dev-shm-usage', // Critical for containerized environments
    '--no-sandbox', // Often needed in GitHub Actions
  ]
}
```

### 3. Test Structure Issues

**Problematic pattern** (repeated 44 times):
```typescript
await page.goto('/');
await page.waitForLoadState('networkidle'); // ❌ HANGS IN CI
```

**Should be:**
```typescript
await page.goto('/', { waitUntil: 'domcontentloaded' }); // ✅ WORKS
// OR
await page.goto('/', { waitUntil: 'load' }); // ✅ WORKS
// OR with specific timeout
await page.waitForLoadState('networkidle', { timeout: 5000 });
```

## Comparison: Local vs CI

| Aspect | Local (Works) | CI (Hangs) |
|--------|---------------|------------|
| Environment | Dev server | Pantheon standalone |
| Build type | `npm run dev` | Production standalone |
| Network | Localhost | CDN + cache handler |
| Workers | 4 | 2 |
| Browser | Headed | Headless |
| ISR | Disabled | Active |
| Cache handler | None | Pantheon custom |

## Why Test Count Matters

The hang occurs **before any test executes**, suggesting a **browser initialization or first navigation issue**:

1. Playwright starts workers
2. Workers launch Chromium browsers (2 instances)
3. First test in each worker attempts `page.goto('/')`
4. Both workers wait for `networkidle`
5. **Standalone build keeps connections open**
6. `networkidle` never achieved
7. No timeout configured
8. Workers hang forever

## Verification Steps Performed

✅ Site accessibility confirmed (user verified traffic)
✅ Environment variables set correctly
✅ Query parameters fixed (not the issue)
✅ Deployment successful (BUILD_SUCCESS confirmed)
✅ Cache cleared before tests
✅ 60s wait + connectivity check before E2E tests

## Why This Wasn't Caught Earlier

1. **Last working commit (7e67de5)**: Had fewer tests, simpler navigation
2. **Worked in development**: Different server characteristics
3. **Worked locally against Pantheon**: Different network conditions/latency
4. **No timeout guards**: Silent hang instead of explicit failure

## Solutions

### Immediate Fix (Highest Priority)

**Option 1: Replace `networkidle` with `domcontentloaded`** (RECOMMENDED)
- Change all 44 instances
- More reliable for SSR applications
- Standard practice for Next.js testing

**Option 2: Add explicit timeouts to `networkidle`**
- Keep current approach but add 5s timeout guards
- Less reliable, still may intermittently fail

**Option 3: Use `load` wait state**
- Middle ground between `networkidle` and `domcontentloaded`
- Waits for `load` event but doesn't wait for all network quiet

### Configuration Hardening (Must Do)

Add to `config/playwright.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  timeout: 30000, // 30s per test
  expect: {
    timeout: 10000, // 10s per assertion
  },
  use: {
    baseURL: process.env.BASE_URL || '...',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // ADD THESE:
    headless: true,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    launchOptions: {
      args: [
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ]
    }
  }
})
```

### Testing Best Practices

**Replace this pattern** (44 instances):
```typescript
await page.goto('/');
await page.waitForLoadState('networkidle');
```

**With this:**
```typescript
// For SSR/Next.js apps, use domcontentloaded
await page.goto('/', { waitUntil: 'domcontentloaded' });

// If you NEED to wait for specific content:
await page.goto('/');
await page.waitForSelector('article', { state: 'visible', timeout: 5000 });

// If you MUST use networkidle, add timeout:
await page.goto('/');
await page.waitForLoadState('networkidle', { timeout: 5000 });
```

## Implementation Priority

1. **CRITICAL**: Add global timeout configuration (prevents infinite hangs)
2. **CRITICAL**: Replace `networkidle` with `domcontentloaded` in all 44 instances
3. **HIGH**: Add browser launch args for CI
4. **MEDIUM**: Add explicit timeouts to assertions
5. **LOW**: Consider reducing test parallelism (2→1 workers) if still unstable

## Expected Outcomes

After fixes:
- ✅ Tests run in CI within 2-3 minutes
- ✅ No infinite hangs
- ✅ Explicit timeout failures if tests genuinely fail
- ✅ Consistent behavior between local and CI
- ✅ Retry logic (2 retries) can handle transient network issues

## References

**Related Playwright Issues:**
- [microsoft/playwright#30307](https://github.com/microsoft/playwright/issues/30307) - Playwright hangs during test
- [microsoft/playwright#15084](https://github.com/microsoft/playwright/issues/15084) - waitForNavigation fails intermittently on Chromium
- [microsoft/playwright#22144](https://github.com/microsoft/playwright/issues/22144) - WebServer only starting after timeout
- [microsoft/playwright#18190](https://github.com/microsoft/playwright/issues/18190) - page.request.get() hangs with timeout parameter

**Key Learning:**
> `networkidle` is unreliable for SSR applications with streaming responses, ISR, or persistent connections. Always prefer `domcontentloaded` or `load` for Next.js applications in CI environments.

## Next Steps

1. Review this analysis
2. Approve fix strategy (Option 1 recommended)
3. Implement changes (can be done in single commit)
4. Test in CI
5. Update documentation with best practices

---

**Analysis performed by**: Claude Sonnet 4.5 (V3 Performance Engineer)
**Co-Authored-By**: Claude <claude@anthropic.com>
