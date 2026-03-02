import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostContent from '@/components/PostContent';
import type { WPPost } from '@/lib/wordpress/types';

describe('PostContent', () => {
  const mockPost: WPPost = {
    id: 1,
    type: 'post',
    title: { rendered: 'Full Post Title' },
    excerpt: { rendered: '<p>Post excerpt</p>' },
    content: {
      rendered: '<p>This is the <strong>full post content</strong> with HTML.</p><p>Multiple paragraphs.</p>',
    },
    date: '2024-01-15T10:30:00',
    date_gmt: '2024-01-15T10:30:00',
    modified: '2024-01-15T10:30:00',
    modified_gmt: '2024-01-15T10:30:00',
    slug: 'full-post',
    status: 'publish' as const,
    link: 'https://example.com/full-post',
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
  };

  it('should render post title', () => {
    render(<PostContent post={mockPost} />);
    expect(screen.getByRole('heading', { name: 'Full Post Title' })).toBeInTheDocument();
  });

  it('should render sanitized post content', () => {
    render(<PostContent post={mockPost} />);
    expect(screen.getByText(/full post content/)).toBeInTheDocument();
    expect(screen.getByText(/Multiple paragraphs/)).toBeInTheDocument();
  });

  it('should render formatted date', () => {
    render(<PostContent post={mockPost} />);
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
  });

  it('should display featured image when available', () => {
    const postWithImage: WPPost = {
      ...mockPost,
      featured_media: 123,
      _embedded: {
        'wp:featuredmedia': [
          {
            id: 123,
            source_url: 'https://cdn.example.com/featured.jpg',
            alt_text: 'Featured Image',
            media_details: {
              width: 1200,
              height: 800,
            },
          },
        ],
      },
    };

    render(<PostContent post={postWithImage} />);
    const image = screen.getByRole('img', { name: /Featured Image/i });
    expect(image).toHaveAttribute('src', expect.stringContaining('featured.jpg'));
  });

  it('should not render image when featured_media is 0', () => {
    render(<PostContent post={mockPost} />);
    const images = screen.queryByRole('img');
    expect(images).not.toBeInTheDocument();
  });

  it('should handle empty content gracefully', () => {
    const postWithoutContent: WPPost = {
      ...mockPost,
      content: { rendered: '' },
    };

    render(<PostContent post={postWithoutContent} />);
    expect(screen.getByRole('heading', { name: 'Full Post Title' })).toBeInTheDocument();
  });
});
