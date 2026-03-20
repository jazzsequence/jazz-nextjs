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

### Manual Deployments (Test & Live)

Test and Live environments require Git tags with specific naming patterns:

#### Deploying to Test

1. **Find the next tag number**:
   ```bash
   git tag --list 'pantheon_test_*' --sort=v:refname | tail -1
   ```

2. **Create and push the tag**:
   ```bash
   git tag pantheon_test_1 -a -m "Deploying to Test"
   git push origin --tags
   ```

3. **Monitor the deployment**:
   ```bash
   terminus node:logs:build:list jazz-nextjs15.test
   ```

#### Deploying to Live

Same process as Test, but use `pantheon_live_N` tags:

```bash
git tag pantheon_live_1 -a -m "Deploying to Live"
git push origin --tags
```

### GitHub Actions Automation

For automated deployments, you can use GitHub Actions to create tags on merge to main.

Example workflow (`.github/workflows/deploy-live.yml`):

```yaml
name: Deploy to Live

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get next tag number
        id: tag
        run: |
          LATEST=$(git tag --list 'pantheon_live_*' --sort=v:refname | tail -1 | sed 's/pantheon_live_//')
          NEXT=$((LATEST + 1))
          echo "number=$NEXT" >> $GITHUB_OUTPUT

      - name: Create and push tag
        run: |
          git tag "pantheon_live_${{ steps.tag.outputs.number }}" -a -m "Auto-deploy to Live"
          git push origin --tags
```

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
1. Checkout code and setup Node.js
2. Install dependencies with `npm ci`
3. Determine target environment (dev or PR-specific)
4. Wait for Pantheon deployment (HTTP polling for up to 10 minutes)
5. **Setup PHP** (required for Terminus)
6. **Install and authenticate Terminus** (via `pantheon-systems/terminus-github-actions@v1`)
7. **Clear Pantheon CDN cache** (`terminus env:clear-cache`)
8. Run unit tests: `npm test -- --run`
9. Run E2E tests: `npm run test:e2e` with `BASE_URL` set to Pantheon environment
10. Report test results in GitHub Actions summary

**Deployment detection**:
- Polls site URL every 20 seconds (max 30 attempts)
- Checks for HTTP 200 status AND content markers ("Jazz Next.js", "Next.js", "__next")
- Fails if deployment not detected within timeout

**Automated cache clearing**:
- After deployment detected, automatically clears Pantheon CDN cache
- Ensures fresh content is served before running tests
- Eliminates manual cache clearing after deployments

**Required GitHub Secret**:
- `PANTHEON_MACHINE_TOKEN` - Machine token for Terminus authentication
  - Generate at: https://dashboard.pantheon.io/users/#account/tokens
  - Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

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

## Last Updated
2026-03-20
