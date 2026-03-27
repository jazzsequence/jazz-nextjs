import { describe, it, expect, vi } from 'vitest'
import type { Metadata } from 'next'

vi.mock('@/lib/wordpress/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wordpress/client')>()
  return {
    ...actual,
    fetchPostsWithPagination: vi.fn().mockResolvedValue({ data: [], totalPages: 3, totalItems: 30, currentPage: 2 }),
    fetchMenuItems: vi.fn().mockResolvedValue([]),
  }
})
vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({ commit: 'abc123', branch: 'main', buildTime: '2024-01-01T00:00:00Z' }),
}))
vi.mock('next/navigation', () => ({ notFound: vi.fn(), forbidden: vi.fn() }))
vi.mock('@/components/Footer', () => ({ default: () => <footer data-testid="footer" /> }))
vi.mock('@/components/Pagination', () => ({ default: () => null }))

describe('Paginated media page — generateMetadata', () => {
  it('returns title with page number', async () => {
    const { generateMetadata } = await import('@/app/media/page/[page]/page')
    const metadata: Metadata = await generateMetadata({ params: Promise.resolve({ page: '2' }) })
    expect(metadata.title).toBe('Media — Page 2')
  })

  it('sets robots noindex, follow on paginated pages', async () => {
    const { generateMetadata } = await import('@/app/media/page/[page]/page')
    const metadata: Metadata = await generateMetadata({ params: Promise.resolve({ page: '3' }) })
    const robots = metadata.robots as { index?: boolean; follow?: boolean }
    expect(robots?.index).toBe(false)
    expect(robots?.follow).toBe(true)
  })
})
