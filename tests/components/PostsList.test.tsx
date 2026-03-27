import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostsList from '@/components/PostsList';
import type { WPPost } from '@/lib/wordpress/types';

describe('PostsList', () => {
  const mockPosts: WPPost[] = [
    {
      id: 1,
      type: 'post',
      title: { rendered: 'First Post' },
      excerpt: { rendered: '<p>First excerpt</p>' },
      content: { rendered: '<p>First content</p>' },
      date: '2024-01-01T00:00:00',
      date_gmt: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      modified_gmt: '2024-01-01T00:00:00',
      slug: 'first-post',
      status: 'publish' as const,
      link: 'https://example.com/first-post',
      author: 1,
      featured_media: 0,
      comment_status: 'open' as const,
      ping_status: 'open' as const,
      sticky: false,
      template: '',
      format: 'standard' as const,
      meta: {},
      categories: [],
      tags: [],
    },
    {
      id: 2,
      type: 'post',
      title: { rendered: 'Second Post' },
      excerpt: { rendered: '<p>Second excerpt</p>' },
      content: { rendered: '<p>Second content</p>' },
      date: '2024-01-02T00:00:00',
      date_gmt: '2024-01-02T00:00:00',
      modified: '2024-01-02T00:00:00',
      modified_gmt: '2024-01-02T00:00:00',
      slug: 'second-post',
      status: 'publish' as const,
      link: 'https://example.com/second-post',
      author: 1,
      featured_media: 0,
      comment_status: 'open' as const,
      ping_status: 'open' as const,
      sticky: false,
      template: '',
      format: 'standard' as const,
      meta: {},
      categories: [],
      tags: [],
    },
  ];

  it('should render all posts in a grid', () => {
    render(<PostsList posts={mockPosts} />);

    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('should render posts in a responsive grid layout', () => {
    const { container } = render(<PostsList posts={mockPosts} />);

    const grid = container.firstChild;
    expect(grid).toHaveClass('grid');
  });

  it('should handle empty posts array', () => {
    const { container } = render(<PostsList posts={[]} />);

    // Should render empty grid
    const grid = container.firstChild;
    expect(grid).toBeEmptyDOMElement();
  });

  it('should render correct number of post cards', () => {
    const { container } = render(<PostsList posts={mockPosts} />);

    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(2);
  });

  it('renders first 3 posts with priority (above-the-fold CLS fix)', () => {
    // Build 4 posts with featured images so priority is observable on img elements
    const postsWithImages: WPPost[] = Array.from({ length: 4 }, (_, i) => ({
      ...mockPosts[0],
      id: i + 1,
      slug: `post-${i + 1}`,
      title: { rendered: `Post ${i + 1}` },
      featured_media: 100 + i,
      _embedded: {
        'wp:featuredmedia': [
          {
            id: 100 + i,
            source_url: `https://cdn.example.com/image-${i}.jpg`,
            alt_text: `Image ${i}`,
            media_details: { width: 800, height: 600 },
          },
        ],
      },
    }));

    const { container } = render(<PostsList posts={postsWithImages} />);

    // The Image mock exposes priority as data-priority="true" so we can assert.
    // Posts at indices 0–2 should have priority; index 3 should not.
    const imgs = container.querySelectorAll('img[data-testid="next-image"]');
    const priorityImgs = Array.from(imgs).filter(
      (img) => img.getAttribute('data-priority') === 'true'
    );
    const nonPriorityImgs = Array.from(imgs).filter(
      (img) => img.getAttribute('data-priority') !== 'true'
    );
    // First 3 images should be priority (above the fold on desktop 3-col grid)
    expect(priorityImgs.length).toBe(3);
    // 4th image should not be priority
    expect(nonPriorityImgs.length).toBe(1);
  });
});
