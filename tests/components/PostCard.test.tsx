import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'fs'
import path from 'path'
import PostCard from '@/components/PostCard';
import type { WPPost } from '@/lib/wordpress/types';

describe('PostCard', () => {
  const mockPost: WPPost = {
    id: 1,
    type: 'post',
    title: { rendered: 'Test Post Title' },
    excerpt: { rendered: '<p>This is a test excerpt with <strong>HTML</strong></p>' },
    content: { rendered: '<p>Full content</p>' },
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

  it('should render post title', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('should render sanitized excerpt', () => {
    render(<PostCard post={mockPost} />);
    // HTML should be rendered but sanitized
    expect(screen.getByText(/This is a test excerpt/)).toBeInTheDocument();
  });

  it('should render formatted date', () => {
    render(<PostCard post={mockPost} />);
    // Should display formatted date (e.g., "January 15, 2024")
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
  });

  it('should link to post slug', () => {
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole('link', { name: /Test Post Title/i });
    expect(link).toHaveAttribute('href', '/posts/test-post');
  });

  it('renders the post title inside the image overlay area (not only in the card body)', () => {
    const { container } = render(<PostCard post={mockPost} />);
    // The title link should be inside the image overlay area (first Link in the article)
    const imageArea = container.querySelector('article > a');
    expect(imageArea?.textContent).toContain('Test Post Title');
  });

  it('renders with dark brand surface (not white)', () => {
    const { container } = render(<PostCard post={mockPost} />);
    const article = container.querySelector('article');
    expect(article?.className).toContain('bg-brand-surface');
    expect(article?.className).not.toContain('bg-white');
  });

  it('should handle missing excerpt gracefully', () => {
    const postWithoutExcerpt: WPPost = {
      ...mockPost,
      excerpt: { rendered: '' },
    };
    render(<PostCard post={postWithoutExcerpt} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('should display featured image when available', () => {
    const postWithImage: WPPost = {
      ...mockPost,
      featured_media: 123,
      _embedded: {
        'wp:featuredmedia': [
          {
            id: 123,
            source_url: 'https://cdn.example.com/image.jpg',
            alt_text: 'Featured image',
            media_details: {
              width: 800,
              height: 600,
            },
          },
        ],
      },
    };
    render(<PostCard post={postWithImage} />);
    const image = screen.getByRole('img', { name: /Featured image/i });
    expect(image).toHaveAttribute('src', expect.stringContaining('image.jpg'));
  });

  it('should not render image when featured_media is 0', () => {
    render(<PostCard post={mockPost} />);
    const images = screen.queryByRole('img');
    expect(images).not.toBeInTheDocument();
  });

  it('should accept priority prop without error (defaults to false)', () => {
    // priority prop is used for above-the-fold cards to prevent CLS
    render(<PostCard post={mockPost} priority={false} />);
    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('renders excerptContent prop instead of plain excerpt when provided', () => {
    const highlighted = <span data-testid="highlighted">jazz <mark>music</mark></span>;
    render(<PostCard post={mockPost} excerptContent={highlighted} />);
    expect(screen.getByTestId('highlighted')).toBeInTheDocument();
    // Plain excerpt text should NOT render when excerptContent overrides it
    expect(screen.queryByText(/This is a test excerpt/)).not.toBeInTheDocument();
  });

  it('renders plain excerpt when excerptContent is not provided', () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText(/This is a test excerpt/)).toBeInTheDocument();
  });

  it('uses accurate mobile sizes on featured image to avoid over-fetching', () => {
    // Lighthouse flags 100vw as too large on mobile — cards have ~32px of horizontal padding.
    // calc(100vw - 32px) selects a smaller Next.js image size bucket (~384px vs ~750px),
    // saving ~94 KiB across the post grid.
    // next/image renders differently in tests so we check the source directly.
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../src/components/PostCard.tsx'),
      'utf8'
    )
    expect(src).toContain('(max-width: 768px) calc(100vw - 32px)')
  })

  it('applies neon-border-hover-subtle (purple) not neon-border-hover (cyan) for card border glow', () => {
    const { container } = render(<PostCard post={mockPost} />)
    const article = container.querySelector('article')
    expect(article?.className).toContain('neon-border-hover-subtle')
    expect(article?.className).not.toContain('neon-border-hover ')
  })

  it('decodes HTML entities in post title (e.g. &#8217; → curly apostrophe)', () => {
    const postWithEntities = {
      ...mockPost,
      title: { rendered: "I&#8217;ll tell you" },
    }
    render(<PostCard post={postWithEntities} />)
    // Should render the decoded curly apostrophe, not the literal entity
    expect(screen.getByRole('heading', { name: /I\u2019ll tell you/i })).toBeInTheDocument()
    expect(screen.queryByText(/&#8217;/)).not.toBeInTheDocument()
  })

  it('decodes HTML entities in excerpt (e.g. &#8217; → curly apostrophe)', () => {
    const postWithEntities = {
      ...mockPost,
      excerpt: { rendered: "<p>It&#8217;s a great post.</p>" },
    }
    render(<PostCard post={postWithEntities} />)
    expect(screen.getByText(/It\u2019s a great post/)).toBeInTheDocument()
    expect(screen.queryByText(/&#8217;/)).not.toBeInTheDocument()
  })

  it('strips Organize Series block from excerpt', () => {
    const postInSeries = {
      ...mockPost,
      excerpt: {
        rendered:
          '<div class="pps-series-post-details"><div class="pps-series-details"><div class="pps-series-title">This entry is part 3 of 5 in the series My Series</div></div></div><p>The actual excerpt text.</p>',
      },
    }
    render(<PostCard post={postInSeries} />)
    expect(screen.queryByText(/this entry is part/i)).not.toBeInTheDocument()
    expect(screen.getByText(/The actual excerpt text/)).toBeInTheDocument()
  })
});
