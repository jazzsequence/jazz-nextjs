import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('PostContent — Twitter embeds', () => {
  // Clean up any Twitter script tags between tests to avoid pollution
  afterEach(() => {
    document.head.querySelectorAll('script[src*="platform.twitter.com"]').forEach(s => s.remove());
  });

  const mockPost = {
    id: 1,
    type: 'post' as const,
    title: { rendered: 'Test Post' },
    excerpt: { rendered: '' },
    date: '2024-01-15T10:30:00',
    date_gmt: '2024-01-15T10:30:00',
    modified: '2024-01-15T10:30:00',
    modified_gmt: '2024-01-15T10:30:00',
    slug: 'test-post',
    status: 'publish' as const,
    link: 'https://example.com/test-post',
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

  it('loads Twitter widget script for classic-editor bare blockquote.twitter-tweet', async () => {
    const post = {
      ...mockPost,
      content: {
        rendered: '<blockquote class="twitter-tweet" data-dnt="true"><p>Tweet text</p>&mdash; Someone (@someone) <a href="https://twitter.com/someone/status/123">Jan 1, 2024</a></blockquote>',
      },
    };
    render(<PostContent post={post} />);
    await waitFor(() => {
      expect(document.head.querySelector('script[src*="platform.twitter.com"]')).toBeInTheDocument();
    });
  });

  it('does not load Twitter widget script when no twitter-tweet content', () => {
    const post = {
      ...mockPost,
      content: { rendered: '<p>Just a regular paragraph.</p>' },
    };
    render(<PostContent post={post} />);
    expect(document.head.querySelector('script[src*="platform.twitter.com"]')).not.toBeInTheDocument();
  });

  it('loads Twitter widget script for Gutenberg wp-block-embed-twitter figure format', async () => {
    const post = {
      ...mockPost,
      content: {
        rendered: '<figure class="wp-block-embed is-type-rich wp-block-embed-twitter"><div class="wp-block-embed__wrapper"><blockquote class="twitter-tweet"><p>Tweet</p></blockquote></div></figure>',
      },
    };
    render(<PostContent post={post} />);
    await waitFor(() => {
      expect(document.head.querySelector('script[src*="platform.twitter.com"]')).toBeInTheDocument();
    });
  });
});
