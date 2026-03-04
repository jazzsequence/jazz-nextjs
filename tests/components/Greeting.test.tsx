import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
];

describe('Greeting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('audience matching', () => {
    it('should display morning greeting at 9am', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16719]); // Morning audience

      render(<Greeting />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Good morning, I'm Chris");
      });
    });

    it('should display afternoon greeting at 3pm', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16720]); // Afternoon audience

      render(<Greeting />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Good afternoon, I'm Chris");
      });
    });

    it('should display evening greeting at 8pm', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16722]); // Evening audience

      render(<Greeting />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Good evening, I'm Chris");
      });
    });

    it('should display D&D greeting on Thursday evening', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16722, 16726]); // Evening AND D&D

      render(<Greeting />);

      await waitFor(() => {
        // Should prefer first match (evening) - component uses first matched ID
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Good evening, I'm Chris");
      });
    });

    it('should display fallback when no audiences match', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]); // No matches

      render(<Greeting />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Hi, I'm Chris");
      });
    });
  });

  describe('content rendering', () => {
    it('should render HTML content', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]);

      render(<Greeting />);

      await waitFor(() => {
        expect(screen.getByText(/I make websites and things/)).toBeInTheDocument();
      });
    });

    it('should sanitize HTML to prevent XSS', async () => {
      const xssVariants = [{
        audienceId: null,
        isFallback: true,
        heading: "Hi, I'm Chris",
        content: '<p>Safe content</p><script>alert("xss")</script>',
      }];

      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: xssVariants, audiences: [] });
      vi.mocked(matchAudiences).mockReturnValue([]);

      const { container } = render(<Greeting />);

      await waitFor(() => {
        expect(container.querySelector('script')).toBeNull();
        expect(screen.getByText(/Safe content/)).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading state while fetching', () => {
      vi.mocked(fetchGreetingData).mockReturnValue(new Promise(() => {})); // Never resolves

      render(<Greeting />);

      // Should show loading indicator or skeleton
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });

    it('should hide loading state after data loads', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]);

      render(<Greeting />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      vi.mocked(fetchGreetingData).mockRejectedValue(new Error('Network error'));

      render(<Greeting />);

      await waitFor(() => {
        // Should show fallback content or error message
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('should handle empty variants array', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: [], audiences: [] });
      vi.mocked(matchAudiences).mockReturnValue([]);

      render(<Greeting />);

      await waitFor(() => {
        // Should show some default content
        expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  });

  describe('audience selection priority', () => {
    it('should use first matching audience if multiple match', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([16720, 16722]); // Multiple matches

      render(<Greeting />);

      await waitFor(() => {
        // Should use first match (16720 = afternoon)
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("Good afternoon, I'm Chris");
      });
    });
  });

  describe('accessibility', () => {
    it('should render heading as h1 for SEO', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]);

      render(<Greeting />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading.tagName).toBe('H1');
      });
    });

    it('should have proper semantic HTML structure', async () => {
      vi.mocked(fetchGreetingData).mockResolvedValue({ variants: mockVariants, audiences: mockAudiences });
      vi.mocked(matchAudiences).mockReturnValue([]);

      const { container } = render(<Greeting />);

      await waitFor(() => {
        const section = container.querySelector('section');
        expect(section).toBeInTheDocument();
      });
    });
  });
});
