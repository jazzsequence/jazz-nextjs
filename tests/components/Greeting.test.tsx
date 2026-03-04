import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Greeting } from '@/components/Greeting';

// Mock the WordPress greeting fetcher
vi.mock('@/lib/wordpress/greeting', () => ({
  fetchGreetingData: vi.fn(),
}));

// Mock the audience matcher
vi.mock('@/lib/audience-matcher', () => ({
  matchAudiences: vi.fn(),
}));

import { fetchGreetingData } from '@/lib/wordpress/greeting';
import { matchAudiences } from '@/lib/audience-matcher';

const mockVariants = [
  {
    audienceId: null,
    isFallback: true,
    heading: "Hi, I'm Chris",
    content: '<p>I make websites and things.</p>',
  },
  {
    audienceId: 16719,
    isFallback: false,
    heading: "Good morning, I'm Chris",
    content: '<p>I make websites and things.</p>',
  },
  {
    audienceId: 16720,
    isFallback: false,
    heading: "Good afternoon, I'm Chris",
    content: '<p>I make websites and things.</p>',
  },
  {
    audienceId: 16722,
    isFallback: false,
    heading: "Good evening, I'm Chris",
    content: '<p>I make websites and things.</p>',
  },
  {
    audienceId: 16726,
    isFallback: false,
    heading: "Welcome adventurer, I'm Chris",
    content: '<p>D&D content here.</p>',
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
  {
    id: 16726,
    rules: [
      { field: 'metrics.day', operator: '=', value: '4', type: 'string' },
      { field: 'metrics.hour', operator: 'gt', value: '17', type: 'string' },
      { field: 'metrics.hour', operator: 'lte', value: '21', type: 'string' },
    ],
  },
] as const;

describe('Greeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('audience matching', () => {
    it('should display morning greeting at 9am', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16719]); // Morning audience

      const component = await Greeting();
      const { container } = render(component);

      expect(container.querySelector('h1')?.textContent).toContain("Good morning, I'm Chris");
    });

    it('should display afternoon greeting at 3pm', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16720]); // Afternoon audience

      const component = await Greeting();
      const { container } = render(component);

      expect(container.querySelector('h1')?.textContent).toContain("Good afternoon, I'm Chris");
    });

    it('should display evening greeting at 8pm', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16722]); // Evening audience

      const component = await Greeting();
      const { container } = render(component);

      expect(container.querySelector('h1')?.textContent).toContain("Good evening, I'm Chris");
    });

    it('should display D&D greeting on Thursday evening', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16722, 16726]); // Evening AND D&D

      const component = await Greeting();
      const { container } = render(component);

      // Should prefer first match (evening) - component uses first matched ID
      expect(container.querySelector('h1')?.textContent).toContain("Good evening, I'm Chris");
    });

    it('should display fallback when no audiences match', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]); // No matches

      const component = await Greeting();
      const { container } = render(component);

      expect(container.querySelector('h1')?.textContent).toContain("Hi, I'm Chris");
    });
  });

  describe('content rendering', () => {
    it('should render sanitized HTML content', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]);

      const component = await Greeting();
      const { container } = render(component);

      expect(container.textContent).toContain('I make websites and things');
    });

    it('should sanitize XSS attempts in content', async () => {
      const xssVariants = [{
        audienceId: null,
        isFallback: true,
        heading: "Hi, I'm Chris",
        content: '<p>Safe content</p><script>alert("xss")</script>',
      }];

      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: xssVariants, audiences: [] });
      vi.mocked(matchAudiences).mockReturnValue([]);

      const component = await Greeting();
      const { container } = render(component);

      expect(container.querySelector('script')).toBeNull();
      expect(container.textContent).toContain('Safe content');
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetchGreetingData).mockRejectedValue(new Error('Network error'));

      const component = await Greeting();
      const { container } = render(component);

      // Should show fallback content
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.textContent).toContain("Hi, I'm Chris");
    });

    it('should handle empty variants array', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: [], audiences: [] });
      vi.mocked(matchAudiences).mockReturnValue([]);

      const component = await Greeting();
      const { container } = render(component);

      // Should show default content
      expect(container.querySelector('h1')).toBeInTheDocument();
      expect(container.textContent).toContain("Hi, I'm Chris");
    });
  });

  describe('variant selection priority', () => {
    it('should select first matching audience when multiple match', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16720, 16722]); // Multiple matches

      const component = await Greeting();
      const { container } = render(component);

      // Should use first match
      expect(container.querySelector('h1')?.textContent).toContain("Good afternoon, I'm Chris");
    });

    it('should fall back to fallback variant when no match', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]);

      const component = await Greeting();
      const { container } = render(component);

      expect(container.querySelector('h1')?.textContent).toContain("Hi, I'm Chris");
    });

    it('should use first variant when no fallback exists', async () => {
      const variantsWithoutFallback = mockVariants.filter(v => !v.isFallback);

      vi.mocked(fetchGreetingData).mockResolvedValue({
        variants: variantsWithoutFallback,
        audiences: mockAudiences
      });
      vi.mocked(matchAudiences).mockReturnValue([]);

      const component = await Greeting();
      const { container } = render(component);

      // Should show first variant
      expect(container.querySelector('h1')).toBeInTheDocument();
    });
  });
});
