import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostPage from '@/app/posts/[slug]/page';
import * as wpClient from '@/lib/wordpress/client';
import { notFound } from 'next/navigation';
import type { WPPost } from '@/lib/wordpress/types';

// Mock the WordPress client and Next.js navigation
vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>();
  return {
    ...actual,
    fetchPost: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

describe('PostPage', () => {
  const mockPost: WPPost = {
    id: 1,
    type: 'post',
    title: { rendered: 'Test Post' },
    excerpt: { rendered: '<p>Test excerpt</p>' },
    content: { rendered: '<p>This is the full post content</p>' },
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render post content', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    const page = await PostPage({ params: Promise.resolve({ slug: 'test-post' }) });
    render(page);

    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText(/This is the full post content/)).toBeInTheDocument();
  });

  it('should call fetchPost with correct parameters', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    await PostPage({ params: Promise.resolve({ slug: 'test-post' }) });

    expect(wpClient.fetchPost).toHaveBeenCalledWith('posts', 'test-post', {
      isr: { revalidate: 3600 },
    });
  });

  it('should call notFound when post does not exist', async () => {
    const error = new wpClient.WPNotFoundError('Post not found');
    vi.mocked(wpClient.fetchPost).mockRejectedValue(error);

    await PostPage({ params: Promise.resolve({ slug: 'non-existent' }) });

    expect(notFound).toHaveBeenCalled();
  });

  it('should handle other errors gracefully', async () => {
    vi.mocked(wpClient.fetchPost).mockRejectedValue(new Error('API Error'));

    const page = await PostPage({ params: Promise.resolve({ slug: 'test-post' }) });
    render(page);

    expect(screen.getByText(/unable to load post/i)).toBeInTheDocument();
  });
});
