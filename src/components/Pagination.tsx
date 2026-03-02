import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

const Pagination = ({ currentPage, totalPages, basePath }: PaginationProps) => {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const getPageUrl = (page: number): string => {
    if (page === 1) {
      return basePath;
    }
    return `${basePath}/page/${page}`;
  };

  const generatePageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Calculate range around current page
    const leftSiblingIndex = Math.max(currentPage - 1, 2);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages - 1);

    // Determine if we need ellipsis
    // Show ellipsis if there's a gap of more than 1 page
    const shouldShowLeftEllipsis = leftSiblingIndex > 3;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 2;

    // Always show first page
    pages.push(1);

    // Left side
    if (shouldShowLeftEllipsis) {
      pages.push('ellipsis');
    } else {
      // Show all pages between 1 and leftSiblingIndex
      for (let i = 2; i < leftSiblingIndex; i++) {
        pages.push(i);
      }
    }

    // Middle pages (around current page)
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    // Right side
    if (shouldShowRightEllipsis) {
      pages.push('ellipsis');
    } else {
      // Show all pages between rightSiblingIndex and last page
      for (let i = rightSiblingIndex + 1; i < totalPages; i++) {
        pages.push(i);
      }
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <nav aria-label="Pagination" className="flex justify-center items-center space-x-2 my-8">
      {/* Previous Button */}
      <Link
        href={isFirstPage ? '#' : getPageUrl(currentPage - 1)}
        aria-label="Go to previous page"
        {...(isFirstPage ? { 'aria-disabled': 'true' } : {})}
        className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
          isFirstPage
            ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Previous
      </Link>

      {/* Page Numbers */}
      <div className="flex space-x-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500"
              >
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
              className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                isCurrentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      <Link
        href={isLastPage ? '#' : getPageUrl(currentPage + 1)}
        aria-label="Go to next page"
        {...(isLastPage ? { 'aria-disabled': 'true' } : {})}
        className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
          isLastPage
            ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Next
      </Link>
    </nav>
  );
};

export default Pagination;
