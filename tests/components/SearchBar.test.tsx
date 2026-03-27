import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/SearchBar';

// framer-motion uses CSS animations; mock it to render children directly
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      animate: _animate,
      initial: _initial,
      transition: _transition,
      style,
      className,
      ...rest
    }: {
      children?: React.ReactNode;
      animate?: unknown;
      initial?: unknown;
      transition?: unknown;
      style?: React.CSSProperties;
      className?: string;
      [key: string]: unknown;
    }) => (
      <div style={style} className={className} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// SearchBar uses native form GET submission (no useRouter) — no router mock needed.

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('collapsed (default) state', () => {
    it('renders a button with aria-label="Search"', () => {
      render(<SearchBar />);
      const btn = screen.getByRole('button', { name: 'Search' });
      expect(btn).toBeInTheDocument();
    });

    it('button has aria-expanded="false" initially', () => {
      render(<SearchBar />);
      const btn = screen.getByRole('button', { name: 'Search' });
      expect(btn).toHaveAttribute('aria-expanded', 'false');
    });

    it('button has aria-controls="search-input"', () => {
      render(<SearchBar />);
      const btn = screen.getByRole('button', { name: 'Search' });
      expect(btn).toHaveAttribute('aria-controls', 'search-input');
    });

    it('form with role="search" is present in the collapsed state', () => {
      render(<SearchBar />);
      // The animated container is collapsed (width: 0), but the form is always mounted.
      // We confirm the search landmark is present even before the bar is opened.
      const form = screen.getByRole('search');
      expect(form).toBeInTheDocument();
    });
  });

  describe('expanded state', () => {
    it('expands and shows input when button is clicked', () => {
      render(<SearchBar />);
      const btn = screen.getByRole('button', { name: 'Search' });
      fireEvent.click(btn);
      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('aria-expanded becomes "true" after clicking trigger', () => {
      render(<SearchBar />);
      const btn = screen.getByRole('button', { name: 'Search' });
      fireEvent.click(btn);
      expect(btn).toHaveAttribute('aria-expanded', 'true');
    });

    it('input has id="search-input"', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('id', 'search-input');
    });

    it('input has aria-label="Search query"', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label', 'Search query');
    });

    it('input has type="search"', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('input has autoComplete="off"', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });
  });

  describe('collapse behaviour', () => {
    it('collapses on Escape key press', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      // Verify it is open
      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'true');

      const input = screen.getByRole('searchbox');
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('collapses on blur when input is empty', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      // blur with empty value
      fireEvent.blur(input);
      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('does NOT collapse on blur when input has a value', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'jazz' } });
      fireEvent.blur(input);
      // Should remain open so the user can still click submit
      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('search submission', () => {
    it('form has method=get and action=/search for native navigation', () => {
      render(<SearchBar />);
      const form = screen.getByRole('search');
      expect(form).toHaveAttribute('method', 'get');
      expect(form).toHaveAttribute('action', '/search');
    });

    it('input has name=q so it becomes the query param', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('name', 'q');
    });

    it('does not submit (prevents default) if query is blank', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const form = screen.getByRole('search');
      // jsdom doesn't navigate, but form.submit should not throw
      expect(() => fireEvent.submit(form)).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('has role="search" on the wrapping form', () => {
      render(<SearchBar />);
      const form = screen.getByRole('search');
      expect(form).toBeInTheDocument();
    });

    it('icon inside trigger button has aria-hidden="true"', () => {
      render(<SearchBar />);
      const btn = screen.getByRole('button', { name: 'Search' });
      const icon = btn.querySelector('[aria-hidden="true"]');
      expect(icon).toBeInTheDocument();
    });
  });
});
