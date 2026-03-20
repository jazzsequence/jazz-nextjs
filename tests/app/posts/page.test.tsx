import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostsPage from '@/app/posts/page';
import * as wpClient from '@/lib/wordpress/client';
import type { WPPost } from '@/lib/wordpress/types';

// Mock the WordPress client
vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>();
  return {
    ...actual,
    fetchPostsWithPagination: vi.fn(),
    fetchMenuItems: vi.fn().mockResolvedValue([]),
  };
});

// Mock getBuildInfo (used by async Footer)
vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({
    commitShort: 'abc123',
    buildTime: '2026-01-01T00:00:00Z',
  }),
}));

// Footer is async — mock to avoid async server component issues in tests
vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

describe('PostsPage', () => {
  const mockPosts: WPPost[] = [
    {
      id: 1,
      type: 'post',
      title: { rendered: 'First Post' },
      excerpt: { rendered: '<p>This is the first post excerpt</p>' },
      content: { rendered: '<p>First post content</p>' },
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
      excerpt: { rendered: '<p>This is the second post excerpt</p>' },
      content: { rendered: '<p>Second post content</p>' },
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render posts list', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: mockPosts,
      totalItems: 2,
      totalPages: 1,
      currentPage: 1,
    });

    const page = await PostsPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('First Post')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('should call fetchPostsWithPagination with correct parameters', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: mockPosts,
      totalItems: 2,
      totalPages: 1,
      currentPage: 1,
    });

    await PostsPage({ searchParams: Promise.resolve({}) });

    expect(wpClient.fetchPostsWithPagination).toHaveBeenCalledWith('posts', {
      page: 1,
      perPage: 12,
      embed: true,
      isr: { revalidate: 3600, tags: ['posts'] },
    });
  });

  it('should display message when no posts exist', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockResolvedValue({
      data: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
    });

    const page = await PostsPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByText('No posts found.')).toBeInTheDocument();
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(wpClient.fetchPostsWithPagination).mockRejectedValue(
      new Error('API Error')
    );

    const page = await PostsPage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByText(/failed to load posts/i)).toBeInTheDocument();
  });
});
