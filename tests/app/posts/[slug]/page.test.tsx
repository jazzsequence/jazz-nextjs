import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostPage, { generateMetadata } from '@/app/posts/[slug]/page';
import * as wpClient from '@/lib/wordpress/client';
import { notFound, forbidden } from 'next/navigation';
import type { WPPost } from '@/lib/wordpress/types';

// Mock the WordPress client and Next.js navigation
vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>();
  return {
    ...actual,
    fetchPost: vi.fn(),
    fetchMenuItems: vi.fn().mockResolvedValue([]),
  };
});

vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({
    commit: 'abc123',
    branch: 'main',
    buildTime: '2024-01-01T00:00:00Z',
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  forbidden: vi.fn(),
}));

// Footer is async — mock to avoid async server component issues in tests
vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
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
      isr: { revalidate: 3600, tags: ['posts', 'post-test-post'] },
      embed: true,
    });
  });

  it('should call notFound when post does not exist', async () => {
    const error = new wpClient.WPNotFoundError('Post not found');
    vi.mocked(wpClient.fetchPost).mockRejectedValue(error);

    await PostPage({ params: Promise.resolve({ slug: 'non-existent' }) });

    expect(notFound).toHaveBeenCalled();
  });

  it('should call forbidden() when post is private (WPForbiddenError)', async () => {
    const error = new wpClient.WPForbiddenError('Post', 'private-post')
    vi.mocked(wpClient.fetchPost).mockRejectedValue(error)

    await PostPage({ params: Promise.resolve({ slug: 'private-post' }) })

    expect(forbidden).toHaveBeenCalled()
    expect(notFound).not.toHaveBeenCalled()
  })

  it('should handle other errors gracefully', async () => {
    vi.mocked(wpClient.fetchPost).mockRejectedValue(new Error('API Error'));

    const page = await PostPage({ params: Promise.resolve({ slug: 'test-post' }) });
    render(page);

    expect(screen.getByText(/unable to load post/i)).toBeInTheDocument();
  });
});

describe('generateMetadata', () => {
  const mockPost: WPPost = {
    id: 1,
    type: 'post',
    title: { rendered: 'Test &amp; Post' },
    excerpt: { rendered: '<p>Test excerpt for the post.</p>' },
    content: { rendered: '<p>Content</p>' },
    date: '2024-01-15T10:30:00',
    date_gmt: '2024-01-15T10:30:00',
    modified: '2024-01-15T12:00:00',
    modified_gmt: '2024-01-15T12:00:00',
    slug: 'test-post',
    status: 'publish' as const,
    link: 'https://example.com/test-post',
    author: 1,
    featured_media: 101,
    comment_status: 'open' as const,
    ping_status: 'open' as const,
    sticky: false,
    template: '',
    format: 'standard' as const,
    meta: {},
    categories: [],
    tags: [],
    _embedded: {
      'wp:featuredmedia': [
        {
          id: 101,
          source_url: 'https://example.com/image.jpg',
          alt_text: 'Test image',
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns post title (decoded) as metadata title', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'test-post' }) });

    expect(result.title).toBe('Test & Post');
  });

  it('returns stripped excerpt as description (max 160 chars)', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'test-post' }) });

    expect(result.description).toBe('Test excerpt for the post.');
  });

  it('returns openGraph with type article', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'test-post' }) });

    expect(result.openGraph).toBeDefined();
    expect((result.openGraph as { type?: string })?.type).toBe('article');
  });

  it('returns openGraph with publishedTime and modifiedTime', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'test-post' }) });

    const og = result.openGraph as { publishedTime?: string; modifiedTime?: string };
    expect(og?.publishedTime).toBe('2024-01-15T10:30:00');
    expect(og?.modifiedTime).toBe('2024-01-15T12:00:00');
  });

  it('returns alternates.canonical for the post slug', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'test-post' }) });

    expect(result.alternates?.canonical).toBe('/posts/test-post');
  });

  it('returns featured image in openGraph images', async () => {
    vi.mocked(wpClient.fetchPost).mockResolvedValue(mockPost);

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'test-post' }) });

    const og = result.openGraph as { images?: Array<{ url: string; alt: string }> };
    expect(og?.images).toHaveLength(1);
    expect(og?.images?.[0].url).toBe('https://example.com/image.jpg');
    expect(og?.images?.[0].alt).toBe('Test image');
  });

  it('returns empty images array when no featured media', async () => {
    const postWithoutImage = { ...mockPost, featured_media: 0, _embedded: undefined };
    vi.mocked(wpClient.fetchPost).mockResolvedValue(postWithoutImage);

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'test-post' }) });

    const og = result.openGraph as { images?: unknown[] };
    expect(og?.images).toHaveLength(0);
  });

  it('returns fallback title on fetch error', async () => {
    vi.mocked(wpClient.fetchPost).mockRejectedValue(new Error('Not found'));

    const result = await generateMetadata({ params: Promise.resolve({ slug: 'missing-post' }) });

    expect(result.title).toBe('Post Not Found');
  });
});
