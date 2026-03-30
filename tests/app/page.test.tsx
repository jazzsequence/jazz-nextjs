import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

// Mock the WordPress client
vi.mock('@/lib/wordpress/client', () => ({
  fetchMenuItems: vi.fn().mockResolvedValue([]),
  fetchPostsWithPagination: vi.fn().mockResolvedValue({
    data: [],
    totalPages: 0,
    page: 1,
    perPage: 12,
    total: 0,
  }),
}));

// Mock Next.js image/link
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

// Footer is now async — mock it so page tests don't need to await it
vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer" />,
}));

describe('HomePage', () => {
  // Homepage must not use searchParams — it forces dynamic rendering (Cache-Control: no-store).
  // Page 1 is always hardcoded; pagination uses /page/[page] routes.
  // ?greeting= is read client-side by GreetingClient, not via server searchParams.
  it('should display Greeting component without searchParams', async () => {
    const Page = await HomePage();
    render(Page);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe("Hi, I'm Chris");
  });

  it('should render without errors when no posts available', async () => {
    const Page = await HomePage();
    const { container } = render(Page);

    const main = container.querySelector('main');
    expect(main).toBeTruthy();

    const message = screen.getByText('No posts found.');
    expect(message).toBeTruthy();
  });

  it('should render footer', async () => {
    const Page = await HomePage();
    const { container } = render(Page);

    expect(container.querySelector('footer')).toBeTruthy();
  });
});
