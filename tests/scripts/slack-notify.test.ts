import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import after mocking
const { formatSlackMessage, sendSlackNotification } = await import('../../scripts/slack-notify.js');

describe('Slack Notification', () => {
  beforeEach(() => {
    // Mock fetch globally
    global.fetch = vi.fn();
    // Reset environment variables
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
    process.env.SLACK_CHANNEL = '#test-channel';
    process.env.GITHUB_SHA = 'abc123def456';
    process.env.GITHUB_REPOSITORY = 'user/repo';
    process.env.GITHUB_ACTOR = 'testuser';
    process.env.GITHUB_REF = 'refs/heads/main';
    process.env.GITHUB_SERVER_URL = 'https://github.com';
    process.env.GITHUB_RUN_ID = '123456789';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatSlackMessage', () => {
    it('should format deployment message with all required fields', () => {
      const message = formatSlackMessage({
        environment: 'dev',
        status: 'success',
        commitHash: 'abc123def456',
        commitMessage: 'Fix: Update deployment script',
        committer: 'John Doe',
        buildTime: 120,
        timestamp: new Date('2026-03-02T10:00:00Z'),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
      });

      expect(message).toHaveProperty('channel');
      expect(message).toHaveProperty('blocks');
      expect(message.blocks).toBeDefined();
      expect(message.blocks.length).toBeGreaterThan(0);
    });

    it('should include success emoji for successful deployments', () => {
      const message = formatSlackMessage({
        environment: 'live',
        status: 'success',
        commitHash: 'abc123',
        commitMessage: 'Deploy to production',
        committer: 'Jane Doe',
        buildTime: 180,
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://live-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#live',
      });

      const headerBlock = message.blocks[0];
      expect(headerBlock.type).toBe('header');
      if (headerBlock.type === 'header') {
        expect(headerBlock.text.text).toContain('🚀');
        expect(headerBlock.text.text).toContain('Successful');
      }
    });

    it('should include failure emoji for failed deployments', () => {
      const message = formatSlackMessage({
        environment: 'test',
        status: 'failure',
        commitHash: 'xyz789',
        commitMessage: 'Attempted deployment',
        committer: 'Test User',
        buildTime: 60,
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://test-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#test',
      });

      const headerBlock = message.blocks[0];
      expect(headerBlock.type).toBe('header');
      if (headerBlock.type === 'header') {
        expect(headerBlock.text.text).toContain('❌');
      }
    });

    it('should format commit hash as short version', () => {
      const message = formatSlackMessage({
        environment: 'dev',
        status: 'success',
        commitHash: 'abc123def456789',
        commitMessage: 'Test commit',
        committer: 'Developer',
        buildTime: 90,
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
      });

      const messageText = JSON.stringify(message);
      expect(messageText).toContain('abc123d'); // Short hash (7 chars)
    });

    it('should include build time in message', () => {
      const message = formatSlackMessage({
        environment: 'dev',
        status: 'success',
        commitHash: 'abc123',
        commitMessage: 'Deploy',
        committer: 'Developer',
        buildTime: 245, // 4m 5s
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
      });

      const messageText = JSON.stringify(message);
      expect(messageText).toContain('4m 5s');
    });

    it('should include clickable links to site and dashboard', () => {
      const message = formatSlackMessage({
        environment: 'live',
        status: 'success',
        commitHash: 'abc123',
        commitMessage: 'Deploy',
        committer: 'Developer',
        buildTime: 120,
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://live-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#live',
      });

      const messageText = JSON.stringify(message);
      expect(messageText).toContain('https://live-jazz-nextjs15.pantheonsite.io');
      expect(messageText).toContain('https://dashboard.pantheon.io/sites/uuid#live');
    });

    it('should handle missing optional fields gracefully', () => {
      const message = formatSlackMessage({
        environment: 'dev',
        status: 'success',
        commitHash: 'abc123',
        commitMessage: 'Deploy',
        committer: 'Developer',
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
      });

      expect(message).toHaveProperty('blocks');
      expect(message.blocks.length).toBeGreaterThan(0);
    });
  });

  describe('sendSlackNotification', () => {
    it('should send POST request to Slack API with correct payload', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

      const params = {
        environment: 'dev',
        status: 'success' as const,
        commitHash: 'abc123',
        commitMessage: 'Deploy',
        committer: 'Developer',
        buildTime: 120,
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
      };

      await sendSlackNotification(params);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://slack.com/api/chat.postMessage',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer xoxb-test-token',
          }),
        })
      );
    });

    it('should throw error if SLACK_BOT_TOKEN is missing', async () => {
      delete process.env.SLACK_BOT_TOKEN;

      await expect(
        sendSlackNotification({
          environment: 'dev',
          status: 'success',
          commitHash: 'abc123',
          commitMessage: 'Deploy',
          committer: 'Developer',
          buildTime: 120,
          timestamp: new Date(),
          siteName: 'jazz-nextjs15',
          siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
          dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
        })
      ).rejects.toThrow('SLACK_BOT_TOKEN environment variable is required');
    });

    it('should use default channel if SLACK_CHANNEL not provided', async () => {
      delete process.env.SLACK_CHANNEL;
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

      await sendSlackNotification({
        environment: 'dev',
        status: 'success',
        commitHash: 'abc123',
        commitMessage: 'Deploy',
        committer: 'Developer',
        buildTime: 120,
        timestamp: new Date(),
        siteName: 'jazz-nextjs15',
        siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
        dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
      });

      const callArgs = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(callArgs[1].body as string);
      expect(body.channel).toBe('#firehose');
    });

    it('should throw error on API failure', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ ok: false, error: 'invalid_auth' }),
      } as Response);

      await expect(
        sendSlackNotification({
          environment: 'dev',
          status: 'success',
          commitHash: 'abc123',
          commitMessage: 'Deploy',
          committer: 'Developer',
          buildTime: 120,
          timestamp: new Date(),
          siteName: 'jazz-nextjs15',
          siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
          dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
        })
      ).rejects.toThrow('Slack API error');
    });

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        sendSlackNotification({
          environment: 'dev',
          status: 'success',
          commitHash: 'abc123',
          commitMessage: 'Deploy',
          committer: 'Developer',
          buildTime: 120,
          timestamp: new Date(),
          siteName: 'jazz-nextjs15',
          siteUrl: 'https://dev-jazz-nextjs15.pantheonsite.io',
          dashboardUrl: 'https://dashboard.pantheon.io/sites/uuid#dev',
        })
      ).rejects.toThrow('Network error');
    });
  });
});
