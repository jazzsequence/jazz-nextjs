# GitHub Actions Setup

This document describes the required GitHub secrets and configuration for automated testing and cache management.

## Required Secrets

### PANTHEON_MACHINE_TOKEN

**Purpose**: Authenticates Terminus CLI for automated cache clearing after deployments.

**How to generate**:

1. Go to [Pantheon Dashboard → Personal Settings → Machine Tokens](https://dashboard.pantheon.io/users/#account/tokens)
2. Click **Create Token**
3. Give it a descriptive name: `GitHub Actions - jazz-nextjs`
4. Copy the token (you'll only see it once)

**How to add to GitHub**:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `PANTHEON_MACHINE_TOKEN`
4. Value: Paste the machine token from Pantheon
5. Click **Add secret**

**Permissions needed**:
- Read access to sites
- Clear cache on environments

**Security notes**:
- Never commit this token to the repository
- Rotate periodically for security
- If compromised, revoke immediately from Pantheon dashboard

## Workflow Behavior

### With PANTHEON_MACHINE_TOKEN configured:
- ✅ Automated cache clearing after deployment
- ✅ Fresh content before running tests
- ✅ Full end-to-end testing workflow
- ✅ Dashboard URL generation for Slack notifications

### Without PANTHEON_MACHINE_TOKEN:
- ❌ Cache clearing step will fail
- ❌ Dashboard URL generation will fail
- ⚠️  Tests may run against stale cached content
- ⚠️  Slack notifications may not have dashboard links
- ⚠️  Manual cache clearing required: `terminus env:clear-cache jazz-nextjs15.dev`

## Testing the Setup

After adding the secret, trigger a workflow run:

```bash
# Push a commit to main
git commit --allow-empty -m "Test GitHub Actions workflow"
git push origin main

# Or manually trigger via GitHub UI
# Actions tab → Test on Pantheon → Run workflow
```

Check the workflow logs for:
```
Installing Terminus...
Authenticating with Pantheon...
Clearing Pantheon CDN cache...
✅ Cache cleared successfully
```

## Terminus GitHub Action

The workflow uses the official [Terminus GitHub Action](https://github.com/pantheon-systems/terminus-github-actions) (`pantheon-systems/terminus-github-actions@v1`), which:
- Installs the latest Terminus CLI
- Authenticates automatically with the machine token
- Caches the Terminus session across workflow jobs
- Handles PHP requirements automatically

## Troubleshooting

### Error: "Invalid machine token"
- Token may have been revoked
- Generate a new token from Pantheon dashboard
- Update the GitHub secret

### Error: "Site not found"
- Verify `PANTHEON_SITE_NAME` in workflow matches your site machine name
- Check `terminus site:list` to confirm site access

### Cache not clearing
- Verify token has cache clearing permissions
- Check workflow logs for Terminus authentication errors
- Manual test: `terminus auth:login --machine-token=TOKEN`

## Related Documentation

- [Pantheon's GitHub Actions](https://docs.pantheon.io/github-actions)
- [Terminus GitHub Action](https://github.com/pantheon-systems/terminus-github-actions)
- [Authenticate Terminus in GitHub Actions](https://docs.pantheon.io/terminus/ci/github-actions)
- [Pantheon Machine Tokens](https://docs.pantheon.io/machine-tokens)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Terminus CLI](https://docs.pantheon.io/terminus)
