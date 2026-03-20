'use client';

import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

const Pagination = ({ currentPage, totalPages, basePath }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number): string => {
    if (page === 1) return basePath;
    if (basePath === '/') return `/page/${page}`;
    return `${basePath}/page/${page}`;
  };

  const generatePageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    const leftSiblingIndex = Math.max(currentPage - 1, 2);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages - 1);
    const shouldShowLeftEllipsis = leftSiblingIndex > 3;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 2;

    pages.push(1);

    if (shouldShowLeftEllipsis) {
      pages.push('ellipsis');
    } else {
      for (let i = 2; i < leftSiblingIndex; i++) pages.push(i);
    }

    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i > 1 && i < totalPages) pages.push(i);
    }

    if (shouldShowRightEllipsis) {
      pages.push('ellipsis');
    } else {
      for (let i = rightSiblingIndex + 1; i < totalPages; i++) pages.push(i);
    }

    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const pages = generatePageNumbers();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const prevNextBase = 'no-underline px-4 py-2 border rounded-md text-sm font-medium font-heading transition-colors';
  const activeLink = 'bg-brand-surface border-brand-border text-brand-text-sub hover:text-brand-cyan hover:border-brand-cyan';
  const disabledLink = 'pointer-events-none opacity-40 bg-brand-surface-high border-brand-border text-brand-muted';

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center gap-2 my-10">
      {/* Previous */}
      <Link
        href={isFirstPage ? '#' : getPageUrl(currentPage - 1)}
        aria-label="Go to previous page"
        {...(isFirstPage ? { 'aria-disabled': 'true' } : {})}
        className={`${prevNextBase} ${isFirstPage ? disabledLink : activeLink}`}
      >
        Previous
      </Link>

      {/* Page numbers */}
      <div className="flex gap-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-brand-muted font-heading text-sm">
                …
              </span>
            );
          }

          const isCurrentPage = page === currentPage;
          return (
            <Link
              key={page}
              href={getPageUrl(page)}
              aria-label={`Go to page ${page}`}
              aria-current={isCurrentPage ? 'page' : undefined}
              className={`no-underline px-4 py-2 border rounded-md text-sm font-heading font-medium transition-colors ${
                isCurrentPage
                  ? 'bg-brand-cyan text-brand-bg border-brand-cyan font-bold'
                  : 'bg-brand-surface border-brand-border text-brand-text-sub hover:text-brand-cyan hover:border-brand-cyan'
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* Next */}
      <Link
        href={isLastPage ? '#' : getPageUrl(currentPage + 1)}
        aria-label="Go to next page"
        {...(isLastPage ? { 'aria-disabled': 'true' } : {})}
        className={`${prevNextBase} ${isLastPage ? disabledLink : activeLink}`}
      >
        Next
      </Link>
    </nav>
  );
};

export default Pagination;
