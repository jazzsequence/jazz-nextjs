import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { GreetingClient } from '@/components/GreetingClient';

// Mock the audience matcher
vi.mock('@/lib/audience-matcher', () => ({
  matchAudiences: vi.fn(),
}));

import { matchAudiences } from '@/lib/audience-matcher';

const mockVariants = [
  {
    audienceId: null,
    isFallback: true,
    heading: "Hi, I'm Chris",
    content: '<p>Welcome to my website.</p>',
  },
  {
    audienceId: 16719,
    isFallback: false,
    heading: "Good morning, I'm Chris",
    content: '<p>Morning content.</p>',
  },
  {
    audienceId: 16720,
    isFallback: false,
    heading: "Good afternoon, I'm Chris",
    content: '<p>Afternoon content.</p>',
  },
  {
    audienceId: 16722,
    isFallback: false,
    heading: "Good evening, I'm Chris",
    content: '<p>Evening content.</p>',
  },
];

const mockAudiences = [
  {
    id: 16719,
    rules: [{ field: 'metrics.hour', operator: 'lt', value: '11', type: 'string' }],
  },
  {
    id: 16720,
    rules: [
      { field: 'metrics.hour', operator: 'gte', value: '11', type: 'string' },
      { field: 'metrics.hour', operator: 'lt', value: '17', type: 'string' },
    ],
  },
  {
    id: 16722,
    rules: [{ field: 'metrics.hour', operator: 'gte', value: '17', type: 'string' }],
  },
] as const;

describe('GreetingClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('client-side timezone matching', () => {
    it('should use browser timezone for matching', () => {
      vi.mocked(matchAudiences).mockReturnValue([16719]); // Morning

      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          serverCountry={undefined}
        />
      );

      // Should call matchAudiences with browser timezone
      expect(matchAudiences).toHaveBeenCalledWith(
        mockAudiences,
        expect.objectContaining({
          country: undefined,
          // Timezone is browser's timezone (e.g., "America/Denver")
          timezone: expect.any(String),
        })
      );

      expect(container.querySelector('h1')?.textContent).toContain("Good morning");
    });

    it('should pass server-detected country to matcher', () => {
      vi.mocked(matchAudiences).mockReturnValue([]);

      render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          serverCountry="US"
        />
      );

      expect(matchAudiences).toHaveBeenCalledWith(
        mockAudiences,
        expect.objectContaining({
          country: "US",
        })
      );
    });
  });

  describe('query parameter testing', () => {
    it('should force morning greeting with ?greeting=morning', () => {
      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          greetingParam="morning"
          serverCountry={undefined}
        />
      );

      expect(container.querySelector('h1')?.textContent).toContain("Good morning");
    });

    it('should force afternoon greeting with ?greeting=afternoon', () => {
      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          greetingParam="afternoon"
          serverCountry={undefined}
        />
      );

      expect(container.querySelector('h1')?.textContent).toContain("Good afternoon");
    });

    it('should force fallback with ?greeting=fallback', () => {
      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          greetingParam="fallback"
          serverCountry={undefined}
        />
      );

      expect(container.querySelector('h1')?.textContent).toContain("Hi, I'm Chris");
    });
  });

  describe('variant selection', () => {
    it('should display matched variant', () => {
      vi.mocked(matchAudiences).mockReturnValue([16720]); // Afternoon

      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          serverCountry={undefined}
        />
      );

      expect(container.querySelector('h1')?.textContent).toContain("Good afternoon");
    });

    it('should fall back when no match', () => {
      vi.mocked(matchAudiences).mockReturnValue([]);

      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          serverCountry={undefined}
        />
      );

      expect(container.querySelector('h1')?.textContent).toContain("Hi, I'm Chris");
    });

    it('should sanitize HTML content', () => {
      vi.mocked(matchAudiences).mockReturnValue([]);

      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          serverCountry={undefined}
        />
      );

      // Should have sanitized content
      expect(container.textContent).toContain('Welcome to my website');
      // Should not have script tags
      expect(container.querySelector('script')).toBeNull();
    });
  });

  describe('featured card presentation', () => {
    it('renders inside a featured card wrapper', () => {
      vi.mocked(matchAudiences).mockReturnValue([]);

      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          serverCountry={undefined}
        />
      )

      expect(container.querySelector('[data-testid="greeting-card"]')).toBeTruthy()
    })
  })

  describe('empty data handling', () => {
    it('should show default fallback when no variants', () => {
      const { container } = render(
        <GreetingClient
          variants={[]}
          audiences={[]}
          serverCountry={undefined}
        />
      );

      expect(container.querySelector('h1')?.textContent).toContain("Hi, I'm Chris");
    });
  });
});
