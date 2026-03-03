import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock build info runtime function
vi.mock('@/lib/build-info', () => ({
  getBuildInfo: vi.fn().mockResolvedValue({
    commitHash: 'abc123def456',
    commitShort: 'abc123d',
    buildTime: '2026-03-03T10:00:00.000Z',
  }),
}));

// Mock the WordPress client
vi.mock('@/lib/wordpress/client', () => ({
  fetchMenuItems: vi.fn().mockResolvedValue([]),
  fetchPostsWithPagination: vi.fn().mockResolvedValue({
    data: [],
    totalPages: 0,
    page: 1,
    perPage: 10,
    total: 0,
  }),
}));

// Mock Next.js components
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Greeting component
vi.mock('@/components/Greeting', () => ({
  Greeting: () => (
    <section>
      <h1>Hi, I&apos;m Chris</h1>
      <div>I make websites and things.</div>
    </section>
  ),
}));

describe('HomePage', () => {
  it('should display build information', async () => {
    const searchParams = { page: '1' };
    const Page = await HomePage({ searchParams });

    render(Page);

    // Build info should be visible
    const buildInfo = screen.getByText(/Build:.*Commit:/);
    expect(buildInfo).toBeTruthy();
    expect(buildInfo.textContent).toContain('abc123d');
  });

  it('should display Greeting component', async () => {
    const searchParams = { page: '1' };
    const Page = await HomePage({ searchParams });

    render(Page);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe("Hi, I'm Chris");
  });

  it('should render without errors when no posts available', async () => {
    const searchParams = { page: '1' };
    const Page = await HomePage({ searchParams });

    const { container } = render(Page);

    // Should render the main element
    const main = container.querySelector('main');
    expect(main).toBeTruthy();

    // Should show "No posts found" message
    const message = screen.getByText('No posts found.');
    expect(message).toBeTruthy();
  });
});
