# Slack Deployment Notifications

This document describes the Slack deployment notification system for the Jazz Next.js project.

## Overview

The project automatically sends deployment notifications to Slack when deployments to Pantheon complete (both successful and failed deployments).

## Architecture

### Components

1. **Notification Script** (`scripts/slack-notify.js`)
   - Formats deployment information into Slack Block Kit messages
   - Sends notifications via Slack API
   - Handles errors gracefully (notifications are non-critical)

2. **GitHub Actions Workflow** (`.github/workflows/slack-notify-deploy.yml`)
   - Triggers after Pantheon deployment workflow completes
   - Collects deployment metadata (commit, environment, build time)
   - Calls notification script with environment variables

3. **Test Suite** (`tests/scripts/slack-notify.test.ts`)
   - 12 tests covering message formatting and API calls
   - Uses TDD London School methodology
   - Mocks Slack API for testing

## Setup

### Prerequisites

- Slack workspace with bot integration
- Bot token with `chat:write` scope
- Access to a Slack channel (default: `#firehose`)

### Script Permissions

Make the notification script executable:

```bash
chmod +x scripts/slack-notify.js
```

### GitHub Repository Configuration

Add the following secret to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `SLACK_DEPLOYBOT_TOKEN` | `xoxb-...` | Slack bot token with `chat:write` scope |

### Slack Channel

The default channel is `#firehose`. To change it, modify the `SLACK_CHANNEL` environment variable in `.github/workflows/slack-notify-deploy.yml`.

### Pantheon Dashboard URLs

Dashboard URLs are automatically constructed using Terminus to fetch:
- Workspace UUID via `terminus site:info --field=organization`
- Site UUID via `terminus site:info --field=id`

The workflow builds the admin dashboard URL:
```
https://admin.dashboard.pantheon.io/workspace/{WORKSPACE_ID}/node-site/{SITE_UUID}/environment/{ENV}/builds
```

This requires the `PANTHEON_MACHINE_TOKEN` secret to be configured (same token used for testing).

## Message Format

Notifications include:

- **Header**: Emoji + status + environment
  - 🚀 for successful live deployments
  - 🧪 for successful test deployments
  - 💻 for successful dev deployments
  - ❌ for failed deployments
- **Site Information**: Site name and environment
- **Commit Details**: Hash, committer, and message
- **Build Metrics**: Build time and timestamp
- **Links**: Live site URL and Pantheon dashboard

### Example Message

```
🚀 Deployed to live

Site: jazz-nextjs15
Environment: live
Commit: abc123d
Committer: John Doe

Commit Message:
Fix: Update deployment script

Build Time: 4m 5s
Timestamp: Mar 2, 2026 at 10:30 AM

🌐 View Site | 📊 Dashboard
```

## Notification Triggers

| Event | Environment | Trigger |
|-------|-------------|---------|
| Push to `main` | `dev` | After deployment to Pantheon dev environment |
| Pull request | `pr-{number}` | After deployment to Pantheon PR environment |
| Tag `pantheon_test_*` | `test` | After deployment to Pantheon test environment |
| Tag `pantheon_live_*` | `live` | After deployment to Pantheon live environment |

## Environment Variables

The notification script uses the following environment variables:

### Required

- `SLACK_BOT_TOKEN` - Slack bot OAuth token (from GitHub secrets)

### Optional (with defaults)

- `SLACK_CHANNEL` - Target Slack channel (default: `#firehose`)
- `PANTHEON_ENV` - Pantheon environment name (default: `dev`)
- `DEPLOYMENT_STATUS` - `success` or `failure` (default: `success`)
- `GITHUB_SHA` - Commit hash (default: `unknown`)
- `COMMIT_MESSAGE` - Commit message (default: `No commit message`)
- `GITHUB_ACTOR` - GitHub username (default: `Unknown`)
- `BUILD_TIME` - Build duration in seconds (optional)
- `PANTHEON_SITE_NAME` - Pantheon site name (default: `jazz-nextjs15`)
- `SITE_URL` - Deployed site URL
- `DASHBOARD_URL` - Pantheon dashboard URL
- `PANTHEON_WORKSPACE_ID` - Pantheon workspace UUID (for accurate dashboard URL)
- `PANTHEON_SITE_UUID` - Pantheon site UUID (for accurate dashboard URL)

## Testing

Run the test suite:

```bash
npm test -- tests/scripts/slack-notify.test.ts
```

### Test Coverage

- ✅ Message formatting with all fields
- ✅ Success/failure emoji selection
- ✅ Commit hash formatting (7 chars)
- ✅ Build time formatting (minutes + seconds)
- ✅ Clickable links to site and dashboard
- ✅ Missing optional fields handling
- ✅ Slack API request structure
- ✅ Error handling (missing token, API errors, network errors)
- ✅ Default channel fallback

### Manual Testing

Test the script locally:

```bash
export SLACK_BOT_TOKEN="xoxb-..."
export SLACK_CHANNEL="#test-channel"
export PANTHEON_ENV="dev"
export DEPLOYMENT_STATUS="success"
export GITHUB_SHA="abc123def456"
export COMMIT_MESSAGE="Test deployment"
export GITHUB_ACTOR="testuser"
export BUILD_TIME="120"
export PANTHEON_SITE_NAME="jazz-nextjs15"
export SITE_URL="https://dev-jazz-nextjs15.pantheonsite.io"
export DASHBOARD_URL="https://dashboard.pantheon.io/sites/jazz-nextjs15#dev"

node scripts/slack-notify.js
```

## Troubleshooting

### Notification Not Received

1. **Check GitHub Actions logs**
   - Go to Actions → Slack Deployment Notifications
   - Review the "Send Slack notification" step

2. **Verify secret configuration**
   - Ensure `SLACK_DEPLOYBOT_TOKEN` is set in repository secrets
   - Token should start with `xoxb-`

3. **Verify bot permissions**
   - Bot needs `chat:write` scope
   - Bot must be invited to target channel

4. **Check channel name**
   - Channel must include `#` prefix
   - Private channels require bot invitation

### Failed API Calls

Check the error message in GitHub Actions logs:

| Error | Cause | Solution |
|-------|-------|----------|
| `invalid_auth` | Invalid or expired token | Regenerate token in Slack App settings |
| `channel_not_found` | Bot not in channel | Invite bot to channel |
| `not_authed` | Missing token | Add `SLACK_DEPLOYBOT_TOKEN` secret |
| `rate_limited` | Too many requests | Wait and retry |

### Build Time Calculation Issues

Build time is calculated from GitHub Actions workflow timing:
- Uses `created_at` and `updated_at` timestamps
- Falls back to empty string if calculation fails
- Non-critical - deployment notification still sent

## Security

- **Never commit** the Slack bot token to the repository
- Store token only in GitHub repository secrets
- Token grants only `chat:write` scope (minimal permissions)
- Notifications are non-critical and won't fail deployments

## Related Documentation

- [GitHub Actions Workflows](../.github/workflows/)
- [Deployment Guide](./DEPLOYMENT.md)
- [Testing Documentation](./TESTING.md)

## References

- [Slack Block Kit](https://api.slack.com/block-kit)
- [Slack API chat.postMessage](https://api.slack.com/methods/chat.postMessage)
- [GitHub Actions workflow_run event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_run)
