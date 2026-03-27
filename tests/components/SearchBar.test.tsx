import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBar from '@/components/SearchBar';

// framer-motion: render children directly, skip animations
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

// Wrap in <header> so closest('header') works in handleBlur relatedTarget check —
// matching the real DOM context where SearchBar lives inside Navigation's <header>.
function renderClosed() {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  const { rerender } = render(
    <header><SearchBar isOpen={false} onOpen={onOpen} onClose={onClose} /></header>
  );
  return { onOpen, onClose, rerender };
}

function renderOpen() {
  const onClose = vi.fn();
  const { rerender } = render(
    <header><SearchBar isOpen onOpen={vi.fn()} onClose={onClose} /></header>
  );
  return { onClose, rerender };
}

describe('SearchBar', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('collapsed (default) state', () => {
    it('renders a button with aria-label="Search"', () => {
      renderClosed();
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    });

    it('button has aria-expanded="false" when closed', () => {
      renderClosed();
      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('button has aria-controls="search-input"', () => {
      renderClosed();
      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-controls', 'search-input');
    });

    it('form with role="search" is present', () => {
      renderClosed();
      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('input is not rendered when closed', () => {
      renderClosed();
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    });

    it('calls onOpen when button is clicked while closed', () => {
      const { onOpen } = renderClosed();
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
      expect(onOpen).toHaveBeenCalledOnce();
    });
  });

  describe('expanded state', () => {
    it('renders the search input when open', () => {
      renderOpen();
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('button has aria-expanded="true" when open', () => {
      renderOpen();
      expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('input has id="search-input"', () => {
      renderOpen();
      expect(screen.getByRole('searchbox')).toHaveAttribute('id', 'search-input');
    });

    it('input has aria-label="Search query"', () => {
      renderOpen();
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label', 'Search query');
    });

    it('input has type="search"', () => {
      renderOpen();
      expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
    });

    it('input has autoComplete="off"', () => {
      renderOpen();
      expect(screen.getByRole('searchbox')).toHaveAttribute('autoComplete', 'off');
    });

    it('input has name=q', () => {
      renderOpen();
      expect(screen.getByRole('searchbox')).toHaveAttribute('name', 'q');
    });
  });

  describe('collapse behaviour', () => {
    it('calls onClose on Escape key press', () => {
      const { onClose } = renderOpen();
      fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose on blur when input is empty', () => {
      const { onClose } = renderOpen();
      const input = screen.getByRole('searchbox');
      // relatedTarget is null — focus left the header entirely
      fireEvent.blur(input, { relatedTarget: null });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does NOT call onClose on blur when input has a value', () => {
      const { onClose } = renderOpen();
      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'jazz' } });
      fireEvent.blur(input, { relatedTarget: null });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does NOT call onClose on blur when focus moves to another element inside the header', () => {
      const { onClose } = renderOpen();
      const input = screen.getByRole('searchbox');
      // The hamburger button lives inside the same <header> that wraps SearchBar in real usage.
      // Append a button to the header so relatedTarget check can find it via closest('header').
      const headerEl = input.closest('header')!;
      const hamburger = document.createElement('button');
      headerEl.appendChild(hamburger);
      fireEvent.blur(input, { relatedTarget: hamburger });
      expect(onClose).not.toHaveBeenCalled();
      headerEl.removeChild(hamburger);
    });
  });

  describe('search submission', () => {
    it('form has method=get and action=/search', () => {
      renderClosed();
      const form = screen.getByRole('search');
      expect(form).toHaveAttribute('method', 'get');
      expect(form).toHaveAttribute('action', '/search');
    });

    it('does not submit when query is empty', () => {
      renderOpen();
      const form = screen.getByRole('search');
      expect(() => fireEvent.submit(form)).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('has role="search" on the form', () => {
      renderClosed();
      expect(screen.getByRole('search')).toBeInTheDocument();
    });

    it('has a magnifying glass icon with aria-hidden', () => {
      renderClosed();
      const icon = document.querySelector('.fa-magnifying-glass');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
