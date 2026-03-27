import { describe, it, expect, vi } from 'vitest';
import { generateMetadata } from '@/app/posts/page/[page]/page';

// We only need to test the metadata export; the page rendering is covered by
// the existing PostsPage tests which share the same logic.

vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>();
  return {
    ...actual,
    fetchPostsWithPagination: vi.fn(),
    fetchMenuItems: vi.fn().mockResolvedValue([]),
  };
});

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

describe('generateMetadata for paginated posts', () => {
  it('returns title with page number', async () => {
    const result = await generateMetadata({ params: Promise.resolve({ page: '3' }) });
    expect(result.title).toBe('Posts — Page 3');
  });

  it('sets robots noindex, follow on paginated pages', async () => {
    const result = await generateMetadata({ params: Promise.resolve({ page: '2' }) });
    const robots = result.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(true);
  });

  it('works for page 1', async () => {
    const result = await generateMetadata({ params: Promise.resolve({ page: '1' }) });
    expect(result.title).toBe('Posts — Page 1');
  });
});
