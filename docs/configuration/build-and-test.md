# Build & Test Configuration

## Build Commands

```bash
# Unit tests
npm test -- --run   # single run; bare `npm test` is watch mode

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

**CRITICAL**: run these before committing — **unless the staged set is text-only**, in which
case run none of them. See "Text-only commits" below.

**These must pass before any commit that is not a text-only staged set (defined below):**

- `npm test -- --run` - Unit tests
- `npm run lint` - Linter
- `npm run build` - Build validation
- `npm run test:e2e` - E2E tests (catches routing conflicts)
- Reviewer agent approval (required for every commit, text-only included)

### Why Each Is Required

- **Unit tests** validate individual components and functions
- **Linter** enforces code style and catches potential bugs
- **Build** ensures production build succeeds
- **E2E tests** validate entire application runtime (catches issues unit tests miss)
- **Reviewer agent** validates compliance with all project standards

### Text-only commits

A staged set is **text-only** when every file left is `.md` or `.txt` after the lock files in
`REVIEWER_EXCLUDED_FILES` are removed from the count — so a lock-file-only stage, such as a
Dependabot merge, qualifies as well. When it is, the
pre-commit hook skips the whole suite — and so should you. Prose cannot break a build, and
running E2E on it wastes minutes per commit. Check before running:

```bash
source .reviewer-config.sh
git diff --cached --name-only \
  | grep -Ev "$REVIEWER_EXCLUDED_FILES" \
  | grep -Ev "$REVIEWER_TEXT_ONLY_PATTERN" | wc -l   # 0 = skip everything
```

Tell the Reviewer agent to skip them too, or it will run the suite itself. And keep
documentation in its own commit: one source file staged alongside makes that count non-zero
and forces the full suite onto a prose change.

### Pre-Commit Hook

The project uses `.githooks/pre-commit` to enforce these checks automatically.

**Install**:
```bash
./.githooks/install.sh
```

**What it checks**: a fresh reviewer-written approval flag, the commit-size cap, the full
test suite (unit, lint, build, E2E — skipped entirely for a text-only staged set, as above),
and staged secrets, in that order.

Deliberately not restated in detail here. `@docs/REVIEWER_WORKFLOW.md` owns the
authoritative list, and `.githooks/pre-commit` is the source of truth if the two ever
disagree. Restating these checks in four separate files is how three of them came to
describe a confirmation prompt that does not exist and omit the entire test suite.

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

**Stack**: ESLint 9.39.5 + `eslint-config-next@16.3.4` using native flat config (no FlatCompat wrapper). Both are resolved versions; the declared range in `package.json` is `^16.3.3`.

ESLint is pinned to `^9` deliberately. ESLint 10 removed `context.getFilename()`, which
`eslint-plugin-react` (pulled in transitively by `eslint-config-next`) still calls, so
`npm run lint` crashes on ESLint 10 with
`TypeError: Error while loading rule 'react/display-name'`. Re-check whether the Next
lint toolchain supports ESLint 10 before unpinning.

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

## Tailwind CSS Configuration

Tailwind 4.3 — config lives in CSS, not a JS file.

**Theme**: Defined in `app/globals.css` `@theme` block — brand colors (`--color-brand-*`) and font families (`--font-mono/sans/heading`).

**PostCSS plugin**: `@tailwindcss/postcss` (in `postcss.config.mjs`).

**Hover behavior**: `@variant hover (&:hover)` in `app/globals.css` restores Tailwind 3 unconditional hover (Tailwind 4 default wraps hover utilities in `@media (hover: hover)`).

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
- [ ] Environment variables configured as Pantheon secrets (a change needs a rebuild)
- [ ] Documentation updated

See `docs/configuration/DEPLOYMENT.md` for full deployment guide.

## Resources

- Vitest: https://vitest.dev
- Playwright: https://playwright.dev
- TDD Workflow: `@docs/workflows/tdd-workflow.md`
- Testing Guide: `@docs/TESTING.md`
