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
});
