import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>()
  return {
    ...actual,
    fetchSeriesBySlug: vi.fn(),
    fetchPostsWithPagination: vi.fn().mockResolvedValue({ data: [], totalItems: 0, totalPages: 0, currentPage: 1 }),
    fetchMenuItems: vi.fn().mockResolvedValue([]),
  }
})

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))

describe('series/[slug] page', () => {
  it('uses searchParams for pagination and remains dynamic (no generateStaticParams)', async () => {
    // Taxonomy routes use searchParams for pagination which is a dynamic API.
    // Adding generateStaticParams would cause DYNAMIC_SERVER_USAGE errors.
    // Edge caching is handled via Cache-Control in next.config.ts headers() instead.
    const page = await import('@/app/series/[slug]/page')
    expect(page.generateStaticParams).toBeUndefined()
    expect(page.revalidate).toBe(3600)
  })
})
