# Build & Test Configuration

## Build Commands

```bash
# Unit tests
npm test

# Lint
npm run lint

# Build
npm run build

# E2E tests (MANDATORY - catches routing conflicts and runtime errors)
npm run test:e2e

# Test standalone build locally (production mode)
npm run start:test
```

## Pre-Commit Quality Checks

**CRITICAL**: ALWAYS run ALL tests before committing (unit + E2E)

**All FIVE commands must pass before any commit:**

1. `npm test -- --run` - Unit tests
2. `npm run lint` - Linter
3. `npm run build` - Build validation
4. `npm run test:e2e` - E2E tests (catches routing conflicts)
5. Reviewer agent approval

### Why All Five Are Required

- **Unit tests** validate individual components and functions
- **Linter** enforces code style and catches potential bugs
- **Build** ensures production build succeeds
- **E2E tests** validate entire application runtime (catches issues unit tests miss)
- **Reviewer agent** validates compliance with all project standards

### Pre-Commit Hook

The project uses `.githooks/pre-commit` to enforce these checks automatically.

**Install**:
```bash
./.githooks/install.sh
```

**What it checks**:
- ✅ Reviewer agent approval (validates all tests passed)
- ✅ No secrets in staged files
- ⚠️ Manual confirmation prompt

See `@docs/REVIEWER_WORKFLOW.md` for full enforcement details.

## Critical Rules

- **NEVER commit code that fails tests, E2E tests, or build**
- **Fix TypeScript/ESLint errors properly**, never whitelist/disable rules
- **Write tests FIRST**, then implement code to make tests pass

## Test Infrastructure

### Vitest Configuration

**Location**: `config/vitest.config.ts`

**Environment**: happy-dom (faster, better ESM compatibility than jsdom)

**Features**:
- TypeScript support
- React component testing
- MSW for API mocking
- Coverage reporting with v8

### Playwright Configuration

**Location**: `config/playwright.config.ts`

**Browsers**: Chromium, Firefox, WebKit

**Features**:
- Multi-browser testing
- Visual regression testing
- Network interception
- Screenshots on failure

## Test Coverage

Current stats:
- **Unit tests**: 176+ passing
- **E2E tests**: 16+ passing
- **Coverage**: Aim for >80% statements, >75% branches

Critical paths (auth, payments, data mutations) should have 100% coverage.

## Standalone Build Testing

```bash
# Build standalone and run E2E tests against it
npm run start:test
```

**Why this matters**:
- Simulates Pantheon production environment
- Tests production-specific behaviors
- Catches bundling/minification issues
- Validates error handling in production mode

## ESLint Configuration

**Location**: `eslint.config.mjs`

**Rules**:
- No `any` types (use `unknown` instead)
- All React hooks properly configured
- Import order enforced
- No console.log in production code

**Ignore patterns**:
- `test-results/**`
- `playwright-report/**`
- `node_modules/**`
- `.next/**`

## TypeScript Configuration

**Location**: `tsconfig.json`

**Strict mode**: Enabled

**Path aliases**:
- `@/*` → `./src/*`

## Build Output

**Mode**: Standalone (required for Pantheon)

```javascript
// next.config.ts
export default {
  output: "standalone",
  // ... other config
}
```

**What gets built**:
- `.next/standalone/` - Server bundle
- `.next/static/` - Static assets
- `public/` - Public assets

## Deployment Validation

Before deploying to Pantheon:

- [ ] All tests passing: `npm test -- --run`
- [ ] Lint clean: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] E2E tests pass: `npm run test:e2e`
- [ ] Standalone build tested: `npm run start:test`
- [ ] No secrets in committed files
- [ ] Environment variables configured in Pantheon dashboard
- [ ] Documentation updated

See `@docs/DEPLOYMENT.md` for full deployment guide.

## Resources

- Vitest: https://vitest.dev
- Playwright: https://playwright.dev
- TDD Workflow: `@docs/workflows/tdd-workflow.md`
- Testing Guide: `@docs/TESTING.md`
