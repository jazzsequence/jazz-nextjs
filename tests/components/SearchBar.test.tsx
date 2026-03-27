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

// useRouter mock — set up at module scope so individual tests can override push
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  notFound: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

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
    it('navigates to /search?q=...&type=all on Enter', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'miles davis' } });
      const form = screen.getByRole('search');
      fireEvent.submit(form);
      expect(mockPush).toHaveBeenCalledWith('/search?q=miles+davis&type=all');
    });

    it('does not navigate if query is blank', () => {
      render(<SearchBar />);
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      const form = screen.getByRole('search');
      fireEvent.submit(form);
      expect(mockPush).not.toHaveBeenCalled();
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
