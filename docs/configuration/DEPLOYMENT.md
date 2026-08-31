# Deployment Guide

This document describes how to deploy the jazz-nextjs application to test and live environments on Pantheon.

## Pantheon Next.js Architecture

The jazz-nextjs site runs on Pantheon's Next.js infrastructure:
- **Hosting**: Node.js containers behind global CDN
- **Build process**: Triggered by GitHub pushes/tags
- **Environments**: Dev, Test, Live, plus PR-specific environments
- **Reference**: [Pantheon documentation site](https://github.com/pantheon-systems/documentation) uses the same architecture

## Environment Pattern

All environments generate unique subdomains:
```
https://<environment>-<site_machine_name>.pantheonsite.io
```

- **Dev**: `dev-jazz-nextjs15.pantheonsite.io`
- **Test**: `test-jazz-nextjs15.pantheonsite.io`
- **Live**: `live-jazz-nextjs15.pantheonsite.io`
- **PRs**: `pr-42-jazz-nextjs15.pantheonsite.io` (PR #42)

## Next.js Configuration Requirements

The `next.config.js` must include:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // REQUIRED for Pantheon deployment
  // ... other config
};

module.exports = nextConfig;
```

## Pantheon Cache Handler

As of February 2026, Pantheon provides `@pantheon-systems/nextjs-cache-handler` for persistent caching that survives deployments.

**Installation**:
```bash
npm install @pantheon-systems/nextjs-cache-handler
```

**Configuration**:

1. Create `cacheHandler.mjs` in project root:
```javascript
import { createCacheHandler } from '@pantheon-systems/nextjs-cache-handler'

const CacheHandler = createCacheHandler({
  type: 'auto', // Auto-detect: GCS if CACHE_BUCKET exists, else file-based
})

export default CacheHandler
```

2. Update `next.config.ts`:
```typescript
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  cacheHandler: path.resolve(__dirname, "./cacheHandler.mjs"),
  cacheMaxMemorySize: 0, // Disable in-memory caching
  output: "standalone",
};
```

**Environment Variables** (set in Pantheon dashboard):
- `CACHE_BUCKET`: GCS bucket name (automatically set by Pantheon in production)
- `OUTBOUND_PROXY_ENDPOINT`: Edge cache proxy (automatically set by Pantheon)
- `CACHE_DEBUG`: Set to `true` or `1` for debug logging (optional)

**Features**:
- Persistent caching across deployments
- Automatic GCS storage in production, file-based in development
- Full support for `revalidateTag()`, `revalidatePath()`, and ISR
- Automatic CDN cache invalidation on content updates
- Smart build deploys: page caches refresh, data caches preserved

**v0.9.0 behavior change**: `revalidateTag()` no longer deletes the cache entries it
revalidates. It marks them stale via the shared `tagsManifest` (matching Next's own
`FileSystemCache.revalidateTag`), so the last-good value stays servable while Next
revalidates in the background.

This matters for high-cardinality tags. Before 0.9.0, revalidating `posts` — which is
attached to the homepage, every archive, and every post — triggered a synchronous
delete-sweep that held the webhook connection open past the client timeout, failing
three `/api/revalidate` E2E tests against Dev. Confirmed fixed on the PR-78 environment.

**Next.js version pin**: `next` is pinned to exactly `16.2.12` (no caret). The 16.3.x
line fails the Pantheon buildpack at "Finalizing page optimization" with
`ENOENT: .next/next-server.js.nft.json`, the file-tracing manifest that
`output: 'standalone'` requires. It does **not** reproduce locally — only in Pantheon's
Linux buildpack under Turbopack, so a green local build is not sufficient evidence.
Re-validate on a PR environment before moving to 16.3.x rather than assuming it is still
broken. The pin stays exact so npm cannot re-resolve into 16.3.x on its own.

**Re-validation log**:

| Date | Version | Result |
|---|---|---|
| 2026-08-17 | 16.3.1 | FAIL — pr-78 build `6c1e9cf6`, `ENOENT next-server.js.nft.json` |
| 2026-08-31 | 16.3.3 | FAIL — pr-88 build `1fe23cd4`, byte-identical `ENOENT` |
| 2026-08-31 | 16.2.12 | **Adopted** — current pin; lint/unit/build/E2E green locally. Buildpack confirmation pending on pr-90 |
| — | 16.3.4 | Untested — shipped 2026-08-31; re-enables AVIF image optimization, which 16.3.3 had disabled |

**Security status of the pin** (as of 2026-08-31 — re-check before acting, advisories move):

**Resolved by the move to 16.2.12.** 16.2.7 carried nine open advisories (4 HIGH:
middleware/proxy bypass, DoS in Server Actions, SSRF in Server Actions on custom servers,
SSRF in rewrites; 5 MODERATE, including cache confusion). All nine list
`firstPatchedVersion: 16.2.11` in the GitHub advisory database — the *same minor line* —
so a patch bump cleared them without touching the 16.3.x line that has failed the
buildpack twice. `npm audit` still reports a `next` finding, but not for any Next.js
advisory — see below.

Two CRITICAL RCEs are named in the 16.3.3 release notes (Windows-hosted servers; the
Image Optimization API with AVIF). Their advisories are not published in the global
database, so their affected ranges could not be confirmed — it is **unknown** whether
they reach 16.2.x. What is known: 16.2.12's release notes contain no security fixes, so
neither has been backported to the 16.2.x line as of 16.2.12. Treat that as a genuinely
open question, not as a reason to jump straight to 16.3.x.

**Don't read `npm audit`'s summary as a verdict on `next`.** It reports one severity and
one `range` per package, merged across every advisory that touches it — direct *and*
transitive. Two ways that misleads:

- **`range` is not a fix boundary.** It spans every version affected by anything, so a
  version that fixes all of the package's own advisories can still appear inside it. At
  16.2.7 the merged range read `9.3.4-canary.0 - 16.3.0-preview.10`, which invites the
  conclusion that the fix lives in 16.3.x. It does not — it is 16.2.11.
- **The finding may not be about `next` at all.** This repo is flagged HIGH on `next`
  right now, with `via: ["postcss","sharp"]` and **zero direct Next.js advisories**. The
  top-level `postcss` (8.5.26) and `sharp` (0.35.4) are both patched; the finding comes
  from copies `next` vendors inside its own tree — `next/node_modules/postcss@8.4.31` and
  `next/node_modules/sharp@0.34.5` — which this repo does not override. `next` pins
  `postcss` exactly (`8.4.31`) and constrains `sharp` to `^0.34.5`; neither top-level
  version satisfies those ranges, so npm nests a second copy of each. An npm `overrides`
  block *could* force them, but overriding a vendored exact pin risks a buildpack that
  has already failed twice without reproducing locally — so the finding is **accepted,
  not unfixable**. Revisit if those advisories become exploitable in this app's usage.
  Check each finding's `nodes` array, not just `via`, to see which copy is implicated.
- **`fixAvailable` can point somewhere dangerous.** For this finding npm reports
  `next@16.3.4` — precisely the line the pin exists to avoid. **Do not run
  `npm audit fix` here**; it would break the Pantheon build.

Read the `via` array — advisory objects are direct, bare strings are transitive — check
`nodes` to locate the offending copy, and check `firstPatchedVersion` on the individual
advisories rather than trusting `fixAvailable`:

```bash
gh api graphql -f query='{securityVulnerabilities(package:"next",ecosystem:NPM,first:30)
  {nodes{severity vulnerableVersionRange firstPatchedVersion{identifier}}}}'
```

To read the real build log (GitHub Actions only reports `BUILD_FAILURE`):

```bash
terminus auth:login --email=<you>@pantheon.io
SESSION=$(cat ~/.terminus/cache/session | python3 -c "import json,sys; print(json.load(sys.stdin)['session'])")
# List builds to get the build ID:
curl -s -H "X-Pantheon-Session: $SESSION" \
  "https://terminus.pantheon.io/api/sites/$SITE_UUID/environment/$ENV/build/list?limit=5"
# Fetch the log — note this path is site-level, NOT environment-scoped:
curl -s -H "X-Pantheon-Session: $SESSION" \
  "https://terminus.pantheon.io/api/sites/$SITE_UUID/build/$BUILD_ID/log"
```

**References**:
- [Release Notes](https://docs.pantheon.io/release-notes/2026/02/nextjs-cache-handler)
- [GitHub Repository](https://github.com/pantheon-systems/nextjs-cache-handler)

## Deployment Methods

### Automatic Deployments

#### Dev Environment
- **Trigger**: Push to `main` branch
- **Process**:
  1. GitHub push triggers Pantheon GitHub Application
  2. Pantheon runs build: `npm ci && npm run build`
  3. Deploys to Dev environment
- **No manual action required**

#### Pull Request Environments
- **Trigger**: Open pull request
- **URL Pattern**: `pr-<number>-<site>.pantheonsite.io`
- **Process**: Same as Dev, but creates temporary environment
- **Cleanup**: Environment deleted when PR closes

### Deploying to Test & Live (Branch-Based)

Test and Live deployments are triggered by merging into the `test` or `live` branches. The [promote-pantheon](.github/workflows/promote-pantheon.yml) GitHub Actions workflow automatically creates the required Pantheon tag (`pantheon_test_N` or `pantheon_live_N`) when a push is detected on either branch.

**To deploy to Test**, merge `main` into `test`:
```bash
git checkout test
git merge main
git push origin test
# CI creates pantheon_test_N and pushes the tag — Pantheon builds Test automatically
```

**To deploy to Live**, merge `test` into `live`:
```bash
git checkout live
git merge test
git push origin live
# CI creates pantheon_live_N and pushes the tag — Pantheon builds Live automatically
```

**Monitor the deployment**:
```bash
terminus node:logs:build:list jazz-nextjs15.test
terminus node:logs:build:list jazz-nextjs15.live
```

**Rollback**: tag a previous commit manually:
```bash
git tag pantheon_live_N <previous-commit-hash>
git push origin pantheon_live_N
```

> **Note for AI agents**: Do NOT merge to `test` or `live` branches without explicit user request. These are production-affecting actions. See `AGENTS.md` for the full rule.

## Build Process

When Pantheon receives a push or tag:

1. **Clone**: Repository cloned at the triggering commit
2. **Install**: `npm ci --quiet --no-fund --no-audit`
   - Uses `yarn` if `yarn.lock` present
   - Uses `pnpm` if `pnpm-lock.yaml` present
3. **Build**: `npm run build`
4. **Deploy**:
   - Static assets → shared object storage
   - Application code → Node.js containers
5. **Monitor** build status:
   ```bash
   terminus node:logs:build:list jazz-nextjs.<env>
   ```

### Build Statuses

- `BUILD_QUEUED` → Build waiting to start
- `BUILD_WORKING` → Build in progress
- `BUILD_SUCCESS` → Build completed successfully
- `DEPLOYMENT_QUEUED` → Deployment waiting
- `DEPLOYMENT_WORKING` → Deployment in progress
- `DEPLOYMENT_SUCCESS` → Live on Pantheon
- `BUILD_FAILURE` / `DEPLOYMENT_FAILURE` → Check logs

### Known Buildpack Restrictions

**Do not commit `.php` files to this repository.**

Pantheon's Google Cloud buildpack detects PHP files and runs the PHP runtime buildpack alongside the Node.js buildpack. When this happens, the Node.js runtime layer (`google.nodejs.runtime`) fails to install correctly, and the deployed container cannot find `node` at `/layers/google.nodejs.runtime/node/bin/node`, causing `DEPLOYMENT_FAILURE`.

If WordPress-related PHP code needs to be distributed alongside this repo (e.g., mu-plugins, webhook handlers), keep it in the WordPress repository (`jazzsequence.com`) rather than here. Reference the file path in comments or documentation if needed.

## Automated Testing on Pantheon

Tests run ON Pantheon environments VIA GitHub Actions workflows. This ensures tests execute against the actual deployed application, not just locally.

### Test Environment URLs

- **Dev**: `dev-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.dev`)
- **PR**: `pr-{number}-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.pr-{number}`)
- **Test**: `test-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.test`)
- **Live**: `live-jazz-nextjs15.pantheonsite.io` (terminus: `jazz-nextjs15.live`)

### GitHub Actions Testing Workflow

The `.github/workflows/test-pantheon.yml` workflow runs automated tests against deployed Pantheon environments:

**Trigger events**:
- Push to `main` branch → tests run against `dev-jazz-nextjs15.pantheonsite.io`
- Pull request opened/updated → tests run against `pr-{number}-jazz-nextjs15.pantheonsite.io`

**Workflow steps**:
1. Checkout code and setup Node.js (version from `.nvmrc`)
2. Restore npm cache, then install dependencies with `npm ci`
3. **Run lint**: `npm run lint` — placed before the deployment wait so its output is
   visible in ~1 minute rather than after a ~10 minute build, and so it still reports
   when the Pantheon build fails
4. Determine target environment (dev or PR-specific)
5. Wait for Pantheon build and deployment (`jazzsequence/pantheon-wait-for-build@v1`)
6. Run unit tests: `npm test -- --run`
7. Install Playwright browsers (chromium)
8. Verify the Pantheon site responds with HTTP 200
9. Run E2E tests: `npm run test:e2e` with `BASE_URL` set to Pantheon environment
10. Upload the Playwright report and publish it to GitHub Pages
11. Report results in the GitHub Actions summary
12. Fail the workflow if lint, unit tests, or E2E did not succeed

**Gating**: lint, unit tests, and E2E each use `continue-on-error: true` so that one
failure does not hide the others. The final step re-reads their `.outcome` values and
exits non-zero if any failed — so the workflow does go red, but only at the end of the
job rather than at the failing step.

**Deployment detection**:
- Build and deploy status come from the `pantheon-wait-for-build` action
- A follow-up accessibility check polls the environment URL for HTTP 200
  (12 attempts, 5s apart) before E2E runs
- Fails if the site is not reachable within that window

**GitHub Secrets used by this workflow**:
- `PANTHEON_MACHINE_TOKEN` - Machine token, passed to the `pantheon-wait-for-build` action
  - Generate at: https://dashboard.pantheon.io/users/#account/tokens
  - Add to GitHub: Settings → Secrets and variables → Actions → New repository secret
- `REVALIDATE_SECRET` - shared secret for `/api/revalidate`. **The whole E2E run fails
  without it.** `tests/e2e/api-revalidate.spec.ts` throws at collection time with a named
  error when `CI` is set and the secret is missing or empty, so the run aborts before any
  test executes — 0 tests, exit 1, and a GitHub annotation naming the secret. That is
  deliberate: it previously fell back to `'test-secret'`, which turned a missing secret
  into ~10 401 failures that read as an auth regression. The fallback is kept for local
  runs, where `webServer.env` uses the same value so client and server agree.
- `WORDPRESS_USERNAME`, `WORDPRESS_APP_PASSWORD` - **not GitHub secrets for this
  workflow.** They are consumed by the Next.js *server runtime*
  (`src/lib/wordpress/client.ts`, `src/lib/wordpress/greeting.ts`,
  `app/api/contact/route.ts`) for WordPress basic auth. On a deployed environment that
  runtime is on Pantheon, so it reads them from Pantheon dashboard env vars — see
  "WordPress Application Passwords" below. They were previously passed to the E2E step
  where they did nothing, and have been removed; do not re-add them.

Other workflows use their own secrets — `slack-notify-deploy.yml` needs
`SLACK_DEPLOYBOT_TOKEN` (see `@docs/architecture/SLACK_NOTIFICATIONS.md`), and it and
`promote-pantheon.yml` reuse `PANTHEON_MACHINE_TOKEN`.

See `.github/workflows/test-pantheon.yml` for full implementation.

### Pantheon API Integration

The [Pantheon API (beta)](https://api.pantheon.io/docs/swagger.json) can be used to:
- Poll build status before running tests
- Retrieve deployment information
- Monitor workflow progress

**Known Limitation**: The current Pantheon documentation repository workflow experiences timeouts waiting for builds to complete. This may require custom polling logic or Pantheon API integration improvements.

### Testing Strategy

1. **Local tests** (`npm test`) - Run during development and pre-commit
2. **Pantheon build** - Triggered by push/PR
3. **GitHub Actions** - Wait for Pantheon build, then run E2E tests
4. **Environment-specific tests** - Different test suites for Dev/PR/Test/Live

## Custom Domain Setup

To connect a custom domain (typically to Live):
1. Follow [Pantheon's custom domain guide](https://docs.pantheon.io/nextjs/connecting-custom-domain)
2. Update DNS records
3. Configure HTTPS certificate

## Pre-Deployment Checklist

Before deploying to Test or Live:

- [ ] All tests passing: `npm test`
- [ ] Build succeeds locally: `npm run build`
- [ ] Standalone build tested: `npm run start:test`
- [ ] E2E tests pass against standalone build
- [ ] No secrets in committed files
- [ ] Environment variables configured in Pantheon dashboard
- [ ] WordPress application passwords have NO spaces (critical for Pantheon)
- [ ] Documentation updated
- [ ] CLAUDE.md and AI_USAGE.md current

## Rollback Strategy

If a deployment causes issues:

1. **Quick fix**: Push fix to GitHub, create new tag
2. **Rollback**: Create tag pointing to previous working commit
   ```bash
   git tag pantheon_live_N <previous-commit-hash> -a -m "Rollback to working version"
   git push origin --tags
   ```

## Environment Variables

Set environment variables in Pantheon dashboard, not in committed files:
- WordPress API URL
- API keys
- Feature flags

Never commit `.env` files to version control.

### Local Development Environment Variables

For local development, create a `.env.local` file in the project root. See `.env.local.example` for the required format.

**CRITICAL**: WordPress application passwords must have all spaces removed, both locally AND in Pantheon.

WordPress displays application passwords with spaces for readability (e.g., `4Wjp 1234 abcd efgh`), but you must remove ALL spaces when storing them:
- **Local**: `.env.local` file
- **Pantheon**: Environment variables in dashboard

**Example `.env.local`**:
```bash
WORDPRESS_API_URL=https://jazzsequence.com/wp-json/wp/v2
WORDPRESS_USERNAME=your_username
WORDPRESS_APP_PASSWORD=4Wjp1234abcdefgh  # NO SPACES!
```

### WordPress Application Passwords (Pantheon)

**CRITICAL**: WordPress application passwords must have all spaces removed when stored in Pantheon environment variables.

WordPress displays application passwords with spaces for readability:
```
4Wjp 1234 abcd efgh
```

But when storing in Pantheon dashboard, remove ALL spaces:
```
4Wjp1234abcdefgh
```

**Why**: Pantheon's build scripts parse environment variables using shell, and values with spaces can cause syntax errors like `local: 4Wjp: bad variable name`, resulting in build failures.

**Affected secrets**:
- `WORDPRESS_APP_PASSWORD` (if using authenticated requests)
- Any other secrets containing spaces

## GitHub Application

Requires Pantheon's GitHub Application to be:
- Installed on the repository
- Authorized for the organization
- Configured with proper permissions

See [Pantheon GitHub Application docs](https://docs.pantheon.io/github-application) for setup.

## References

- [Pantheon Next.js Architecture](https://docs.pantheon.io/nextjs/architecture)
- [Test and Live Environments](https://docs.pantheon.io/nextjs/test-and-live-env)
- [Pantheon Documentation Repository](https://github.com/pantheon-systems/documentation) (reference implementation)

## OG Image URL Configuration

OG image URLs are set as absolute URLs via `OG_IMAGE_URL` in `src/lib/utils/og.ts` using `NEXT_PUBLIC_SITE_URL ?? https://next.jazzsequence.com`, preventing `metadataBase` domain mismatch.

## Last Updated
2026-04-03
