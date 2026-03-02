#!/usr/bin/env node

/**
 * Slack deployment notification script
 * Sends formatted deployment notifications to Slack using the Slack API
 */

/**
 * @typedef {Object} DeploymentInfo
 * @property {string} environment - Pantheon environment (dev/test/live)
 * @property {'success' | 'failure'} status - Deployment status
 * @property {string} commitHash - Full commit SHA
 * @property {string} commitMessage - Commit message
 * @property {string} committer - Person who committed
 * @property {number} [buildTime] - Build time in seconds
 * @property {Date} timestamp - Deployment timestamp
 * @property {string} siteName - Pantheon site name
 * @property {string} siteUrl - Live site URL
 * @property {string} dashboardUrl - Pantheon dashboard URL
 */

/**
 * @typedef {Object} SlackBlock
 * @property {string} type - Block type (header, section, divider, etc.)
 * @property {Object} [text] - Text object for the block
 * @property {Array} [fields] - Fields for section blocks
 */

/**
 * @typedef {Object} SlackMessage
 * @property {string} channel - Slack channel to post to
 * @property {SlackBlock[]} blocks - Message blocks
 */

/**
 * Format build time from seconds to human-readable format
 * @param {number} seconds - Build time in seconds
 * @returns {string} Formatted time (e.g., "2m 30s")
 */
function formatBuildTime(seconds) {
  if (!seconds || seconds < 0) return '';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Get emoji for deployment workflow
 * @param {'success' | 'failure'} status - Deployment status
 * @param {string} environment - Environment name
 * @returns {string} Emoji
 */
function getWorkflowEmoji(status, environment) {
  if (status === 'failure') return '❌';
  if (environment === 'live') return '🚀';
  if (environment === 'test') return '🧪';
  return '💻';
}

/**
 * Truncate commit message if too long
 * @param {string} message - Commit message
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated message
 */
function truncateMessage(message, maxLength = 200) {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
}

/**
 * Get color for deployment status
 * @param {'success' | 'failure'} status - Deployment status
 * @returns {string} Hex color code
 */
function getStatusColor(status) {
  return status === 'success' ? '#36a64f' : '#d00000';
}

/**
 * Format deployment information into Slack message blocks
 * @param {DeploymentInfo} info - Deployment information
 * @returns {SlackMessage} Formatted Slack message with blocks
 */
export function formatSlackMessage(info) {
  const {
    environment,
    status,
    commitHash,
    commitMessage,
    committer,
    buildTime,
    timestamp,
    siteName,
    siteUrl,
    dashboardUrl,
  } = info;

  const shortHash = commitHash.substring(0, 7);
  const emoji = getWorkflowEmoji(status, environment);
  const statusText = status === 'success' ? 'Deployment Successful' : 'Deployment Failed';
  const channel = process.env.SLACK_CHANNEL || '#firehose';
  const envDisplay = environment.toUpperCase();

  // GitHub commit URL (assumes GitHub repository from GITHUB_REPOSITORY env var)
  const githubRepo = process.env.GITHUB_REPOSITORY || 'chrisreynolds/jazz-nextjs';
  const commitUrl = `https://github.com/${githubRepo}/commit/${commitHash}`;

  /** @type {SlackBlock[]} */
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${statusText}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Environment:*\n${envDisplay}`,
        },
        {
          type: 'mrkdwn',
          text: `*Site:*\n${siteName}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Commit:* <${commitUrl}|\`${shortHash}\`> by ${committer}\n>${truncateMessage(commitMessage, 150)}`,
      },
    },
  ];

  // Add timing context
  const contextElements = [
    {
      type: 'mrkdwn',
      text: `⏱️ Build: ${buildTime ? formatBuildTime(buildTime) : 'N/A'}`,
    },
    {
      type: 'mrkdwn',
      text: `🕐 <!date^${Math.floor(timestamp.getTime() / 1000)}^{date_short_pretty} at {time}|${timestamp.toISOString()}>`,
    },
  ];

  blocks.push({
    type: 'context',
    elements: contextElements,
  });

  // Add action buttons
  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '🌐 View Site',
            emoji: true,
          },
          url: siteUrl,
          style: status === 'success' ? 'primary' : undefined,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📊 Dashboard',
            emoji: true,
          },
          url: dashboardUrl,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '💻 Commit',
            emoji: true,
          },
          url: commitUrl,
        },
      ],
    }
  );

  return {
    channel,
    blocks,
    attachments: [
      {
        color: getStatusColor(status),
        blocks: [],
      },
    ],
  };
}

/**
 * Send notification to Slack
 * @param {DeploymentInfo} info - Deployment information
 * @returns {Promise<void>}
 */
export async function sendSlackNotification(info) {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    throw new Error('SLACK_BOT_TOKEN environment variable is required');
  }

  const message = formatSlackMessage(info);

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(`Slack API error: ${response.status} ${response.statusText} - ${result.error || 'Unknown error'}`);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Get deployment info from environment variables (set by GitHub Actions)
    const environment = process.env.PANTHEON_ENV || 'dev';
    const status = process.env.DEPLOYMENT_STATUS === 'failure' ? 'failure' : 'success';
    const commitHash = process.env.GITHUB_SHA || 'unknown';
    const commitMessage = process.env.COMMIT_MESSAGE || 'No commit message';
    const committer = process.env.GITHUB_ACTOR || 'Unknown';
    const buildTime = process.env.BUILD_TIME ? parseInt(process.env.BUILD_TIME, 10) : undefined;
    const siteName = process.env.PANTHEON_SITE_NAME || 'jazz-nextjs15';
    const siteUrl = process.env.SITE_URL || `https://${environment}-${siteName}.pantheonsite.io`;
    const dashboardUrl = process.env.DASHBOARD_URL || `https://dashboard.pantheon.io/sites/${siteName}#${environment}`;

    /** @type {DeploymentInfo} */
    const deploymentInfo = {
      environment,
      status,
      commitHash,
      commitMessage,
      committer,
      buildTime,
      timestamp: new Date(),
      siteName,
      siteUrl,
      dashboardUrl,
    };

    console.log('Sending Slack notification...');
    console.log(`Environment: ${environment}`);
    console.log(`Status: ${status}`);
    console.log(`Commit: ${commitHash.substring(0, 7)}`);

    await sendSlackNotification(deploymentInfo);

    console.log('✅ Slack notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send Slack notification:', error);
    // Don't fail the workflow if Slack notification fails
    process.exit(0);
  }
}

// Run main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
