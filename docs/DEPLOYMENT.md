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

- **Dev**: `dev-jazz-nextjs.pantheonsite.io`
- **Test**: `test-jazz-nextjs.pantheonsite.io`
- **Live**: `live-jazz-nextjs.pantheonsite.io`
- **PRs**: `pr-42-jazz-nextjs.pantheonsite.io` (PR #42)

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
   terminus node:logs:build:list jazz-nextjs.test
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

## Custom Domain Setup

To connect a custom domain (typically to Live):
1. Follow [Pantheon's custom domain guide](https://docs.pantheon.io/nextjs/connecting-custom-domain)
2. Update DNS records
3. Configure HTTPS certificate

## Pre-Deployment Checklist

Before deploying to Test or Live:

- [ ] All tests passing: `npm test`
- [ ] Build succeeds locally: `npm run build`
- [ ] No secrets in committed files
- [ ] Environment variables configured in Pantheon dashboard
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
2026-02-26
