import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
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
  {
    audienceId: 16377,
    isFallback: false,
    heading: "Ni hao, I'm Chris",
    content: '<p>China content.</p>',
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
    id: 16377,
    rules: [{ field: 'endpoints.country', operator: 'equals', value: 'CN', type: 'string' }],
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
    it('should read ?greeting= from window.location.search when no greetingParam prop', () => {
      // Server no longer reads searchParams for greeting (would force dynamic rendering).
      // GreetingClient reads it client-side from the URL instead.
      // A spread of window.location copies only own enumerable properties, so href and
      // origin — which live on the prototype — are lost. That silently breaks relative-URL
      // resolution for every later test in this file, including GreetingClient's own
      // fetch('/api/country'). Use a real URL, which carries href/origin/search, and
      // restore the original descriptor afterwards.
      const originalLocation = Object.getOwnPropertyDescriptor(window, 'location')
      Object.defineProperty(window, 'location', {
        value: new URL('http://localhost:3000/?greeting=morning'),
        writable: true,
        configurable: true,
      })

      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          serverCountry={undefined}
        />
      )

      expect(container.querySelector('h1')?.textContent).toContain('Good morning')

      // Restore the real Location object, not a copy of it.
      if (originalLocation) {
        Object.defineProperty(window, 'location', originalLocation)
      } else {
        delete (window as unknown as Record<string, unknown>).location
      }
    })

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

  // Pass 2 of GreetingClient fetches /api/country and re-matches. Until the MSW handler
  // for that route existed, this fetch always failed, so none of these paths were covered:
  // every test only ever exercised pass 1. The default handler returns { country: null },
  // so tests that need a country override it with server.use().
  describe('geo-targeting (pass 2 country fetch)', () => {
    // Distinguish the two passes by what the matcher is given: pass 1 has no country,
    // pass 2 has the fetched one. Anything else would not prove a re-match occurred.
    const matchByCountry = () =>
      vi.mocked(matchAudiences).mockImplementation((_audiences, endpoints) =>
        (endpoints as { country?: string }).country === 'CN' ? [16377] : [16722]
      );

    it('re-matches the variant after /api/country returns a country', async () => {
      matchByCountry();
      server.use(http.get('*/api/country', () => HttpResponse.json({ country: 'CN' })));

      const { container } = render(
        <GreetingClient variants={mockVariants} audiences={mockAudiences} serverCountry={undefined} />
      );

      // Pass 1: no country yet, so the time-based variant renders first.
      expect(container.querySelector('h1')?.textContent).toContain('Good evening');

      // Pass 2: the fetched country produces a different match.
      await waitFor(() => {
        expect(container.querySelector('h1')?.textContent).toContain('Ni hao');
      });

      expect(matchAudiences).toHaveBeenCalledWith(
        mockAudiences,
        expect.objectContaining({ country: 'CN' })
      );
    });

    it('keeps the pass-1 variant when the country comes back null', async () => {
      matchByCountry();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      server.use(http.get('*/api/country', () => HttpResponse.json({ country: null })));

      const { container } = render(
        <GreetingClient variants={mockVariants} audiences={mockAudiences} serverCountry={undefined} />
      );

      // Wait for the fetch to actually resolve, so "unchanged" means the guard held
      // rather than that we asserted before pass 2 ran.
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/country'));
      await waitFor(() => {
        expect(container.querySelector('h1')?.textContent).toContain('Good evening');
      });

      // Assert the re-match never ran at all. Checking only the rendered heading would
      // pass even if the guard were removed, because re-matching on a null country
      // returns the same variant — the test would agree for the wrong reason.
      expect(matchAudiences).toHaveBeenCalledTimes(1);
      fetchSpy.mockRestore();
    });

    it('keeps the pass-1 variant when the country fetch fails', async () => {
      matchByCountry();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      server.use(http.get('*/api/country', () => HttpResponse.error()));

      const { container } = render(
        <GreetingClient variants={mockVariants} audiences={mockAudiences} serverCountry={undefined} />
      );

      await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith('/api/country'));
      await waitFor(() => {
        expect(container.querySelector('h1')?.textContent).toContain('Good evening');
      });
      fetchSpy.mockRestore();
    });

    it('does not fetch the country when ?greeting= is set', async () => {
      matchByCountry();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const { container } = render(
        <GreetingClient
          variants={mockVariants}
          audiences={mockAudiences}
          greetingParam="morning"
          serverCountry={undefined}
        />
      );

      expect(container.querySelector('h1')?.textContent).toContain('Good morning');
      // An explicit greeting is a deliberate override; re-matching on country would undo it.
      expect(fetchSpy).not.toHaveBeenCalledWith('/api/country');
      fetchSpy.mockRestore();
    });

    it('does not fetch the country when serverCountry is already known', async () => {
      matchByCountry();
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      render(
        <GreetingClient variants={mockVariants} audiences={mockAudiences} serverCountry="CN" />
      );

      await waitFor(() =>
        expect(matchAudiences).toHaveBeenCalledWith(
          mockAudiences,
          expect.objectContaining({ country: 'CN' })
        )
      );
      // The server already supplied it, so the extra round trip would be wasted.
      expect(fetchSpy).not.toHaveBeenCalledWith('/api/country');
      fetchSpy.mockRestore();
    });
  });

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
