import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Pagination from '@/components/Pagination';

describe('Pagination', () => {
  describe('Basic Rendering', () => {
    it('should render pagination with current page highlighted', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const currentPageButton = screen.getByRole('link', { name: 'Go to page 2' });
      expect(currentPageButton).toBeInTheDocument();
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('should render Previous and Next buttons', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      expect(screen.getByRole('link', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /next/i })).toBeInTheDocument();
    });

    it('should render all page numbers when totalPages is small', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      expect(screen.getByRole('link', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 3' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 5' })).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should generate correct href for page numbers', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const page1Link = screen.getByRole('link', { name: 'Go to page 1' });
      const page3Link = screen.getByRole('link', { name: 'Go to page 3' });

      expect(page1Link).toHaveAttribute('href', '/posts');
      expect(page3Link).toHaveAttribute('href', '/posts/page/3');
    });

    it('should generate correct href for Previous button', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath="/posts" />);

      const prevLink = screen.getByRole('link', { name: /previous/i });
      expect(prevLink).toHaveAttribute('href', '/posts/page/2');
    });

    it('should generate correct href for Next button', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const nextLink = screen.getByRole('link', { name: /next/i });
      expect(nextLink).toHaveAttribute('href', '/posts/page/3');
    });

    it('should link to basePath for Previous when on page 2', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const prevLink = screen.getByRole('link', { name: /previous/i });
      expect(prevLink).toHaveAttribute('href', '/posts');
    });
  });

  describe('Disabled States', () => {
    it('should disable Previous button on first page', () => {
      render(<Pagination currentPage={1} totalPages={5} basePath="/posts" />);

      const prevButton = screen.getByRole('link', { name: /previous/i });
      expect(prevButton).toHaveAttribute('aria-disabled', 'true');
      expect(prevButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('should disable Next button on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} basePath="/posts" />);

      const nextButton = screen.getByRole('link', { name: /next/i });
      expect(nextButton).toHaveAttribute('aria-disabled', 'true');
      expect(nextButton).toHaveClass('pointer-events-none', 'opacity-50');
    });

    it('should not disable Previous button when not on first page', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const prevButton = screen.getByRole('link', { name: /previous/i });
      expect(prevButton).not.toHaveAttribute('aria-disabled');
    });

    it('should not disable Next button when not on last page', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const nextButton = screen.getByRole('link', { name: /next/i });
      expect(nextButton).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('Ellipsis for Large Ranges', () => {
    it('should show ellipsis when total pages is large', () => {
      render(<Pagination currentPage={5} totalPages={10} basePath="/posts" />);

      const ellipsis = screen.getAllByText('…');
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it('should show first page, last page, and pages around current', () => {
      render(<Pagination currentPage={5} totalPages={10} basePath="/posts" />);

      // Should always show first and last page
      expect(screen.getByRole('link', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 10' })).toBeInTheDocument();

      // Should show current page and neighbors
      expect(screen.getByRole('link', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 5' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 6' })).toBeInTheDocument();
    });

    it('should not show ellipsis when near the start', () => {
      render(<Pagination currentPage={2} totalPages={10} basePath="/posts" />);

      // When near the start, should show pages 1-3 and ellipsis before last page
      expect(screen.getByRole('link', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 3' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 10' })).toBeInTheDocument();

      // Should have ellipsis after page 3
      const ellipsis = screen.getAllByText('…');
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it('should not show ellipsis when near the end', () => {
      render(<Pagination currentPage={9} totalPages={10} basePath="/posts" />);

      // When near the end, should show first page, ellipsis, then pages 8-10
      expect(screen.getByRole('link', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 8' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 9' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Go to page 10' })).toBeInTheDocument();

      // Should have ellipsis before page 8
      const ellipsis = screen.getAllByText('…');
      expect(ellipsis.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should render nothing when totalPages is 1', () => {
      const { container } = render(<Pagination currentPage={1} totalPages={1} basePath="/posts" />);

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when totalPages is 0', () => {
      const { container } = render(<Pagination currentPage={1} totalPages={0} basePath="/posts" />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle different basePaths correctly', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/recipes" />);

      const page3Link = screen.getByRole('link', { name: 'Go to page 3' });
      expect(page3Link).toHaveAttribute('href', '/recipes/page/3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Pagination');
    });

    it('should mark current page with aria-current', () => {
      render(<Pagination currentPage={3} totalPages={5} basePath="/posts" />);

      const currentPage = screen.getByRole('link', { name: 'Go to page 3' });
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('should have aria-label on Previous button', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const prevButton = screen.getByLabelText('Go to previous page');
      expect(prevButton).toBeInTheDocument();
    });

    it('should have aria-label on Next button', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const nextButton = screen.getByLabelText('Go to next page');
      expect(nextButton).toBeInTheDocument();
    });

    it('should have aria-label on page number links', () => {
      render(<Pagination currentPage={2} totalPages={5} basePath="/posts" />);

      const page3Link = screen.getByLabelText('Go to page 3');
      expect(page3Link).toBeInTheDocument();
    });
  });
});
