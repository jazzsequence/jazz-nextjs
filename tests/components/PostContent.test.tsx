import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import PostContent from '@/components/PostContent';
import type { WPPost } from '@/lib/wordpress/types';

// Mock SocialScriptLoader — PostContent tests verify it is always rendered and
// receives the raw content. Detection/script-injection is SocialScriptLoader's concern.
vi.mock('@/components/SocialScriptLoader', () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="social-script-loader" data-content-snapshot={content.slice(0, 50)} />
  ),
}));

// Mock WPEmbedCard — avoids oEmbed fetch; captures the url and fallbackTitle props.
vi.mock('@/components/WPEmbedCard', () => ({
  default: ({ url, fallbackTitle }: { url: string; fallbackTitle: string }) => (
    <article data-testid="wp-embed-card">
      <a href={url}>{fallbackTitle}</a>
    </article>
  ),
}));

// Mock ArticleCardWithImage — avoids useEffect fetch in unit tests; we test
// that the correct props (including excerpt) are forwarded.
vi.mock('@/components/ArticleCardWithImage', () => ({
  default: ({ href, title, excerpt, sourceName }: {
    href: string; title: string; excerpt?: string; sourceName?: string
  }) => (
    <article data-testid="article-card-with-image">
      <a href={href}>{title}</a>
      {excerpt && <p data-testid="article-excerpt">{excerpt}</p>}
      {sourceName && <span data-testid="article-source">{sourceName}</span>}
    </article>
  ),
}));

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

describe('PostContent — gallery caption extraction', () => {
  const basePost = {
    id: 1,
    type: 'post' as const,
    title: { rendered: 'Gallery Post' },
    excerpt: { rendered: '' },
    date: '2024-01-15T10:30:00',
    date_gmt: '2024-01-15T10:30:00',
    modified: '2024-01-15T10:30:00',
    modified_gmt: '2024-01-15T10:30:00',
    slug: 'gallery-post',
    status: 'publish' as const,
    link: 'https://example.com/gallery-post',
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

  it('passes figcaption text as caption to GalleryLightbox', () => {
    const post = {
      ...basePost,
      content: {
        rendered: `<figure class="wp-block-gallery has-nested-images">
          <figure class="wp-block-image size-full">
            <img src="/thumb1.jpg" alt="Miniature one" />
            <figcaption class="wp-element-caption">A resin-printed dragon</figcaption>
          </figure>
          <figure class="wp-block-image size-full">
            <img src="/thumb2.jpg" alt="Miniature two" />
          </figure>
        </figure>`,
      },
    };
    render(<PostContent post={post} />);
    // Open the first gallery image
    fireEvent.click(screen.getAllByRole('listitem')[0]);
    // Caption should appear in the lightbox
    expect(screen.getByText('A resin-printed dragon')).toBeInTheDocument();
  });

  it('does not show caption in lightbox when figcaption is absent', () => {
    const post = {
      ...basePost,
      content: {
        rendered: `<figure class="wp-block-gallery has-nested-images">
          <figure class="wp-block-image size-full">
            <img src="/thumb1.jpg" alt="Image one" />
          </figure>
        </figure>`,
      },
    };
    render(<PostContent post={post} />);
    fireEvent.click(screen.getAllByRole('listitem')[0]);
    // The lightbox should open but no caption paragraph should be present
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/caption/i)).not.toBeInTheDocument();
  });
});


describe('PostContent — SocialScriptLoader replaces TwitterScriptLoader', () => {
  const basePost = {
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

  it('renders SocialScriptLoader on every post (unconditional)', () => {
    render(<PostContent post={{ ...basePost, content: { rendered: '<p>Plain post.</p>' } }} />);
    expect(screen.getByTestId('social-script-loader')).toBeInTheDocument();
  });

  it('passes raw post content to SocialScriptLoader so it can detect platform embeds', () => {
    const content = '<blockquote class="twitter-tweet"><p>Tweet</p></blockquote>';
    render(<PostContent post={{ ...basePost, content: { rendered: content } }} />);
    expect(screen.getByTestId('social-script-loader'))
      .toHaveAttribute('data-content-snapshot', expect.stringContaining('twitter-tweet'));
  });

  it('does not render the old TwitterScriptLoader', () => {
    render(<PostContent post={{ ...basePost, content: { rendered: '<blockquote class="twitter-tweet"><p>Tweet</p></blockquote>' } }} />);
    expect(screen.queryByTestId('twitter-script-loader')).not.toBeInTheDocument();
  });
});

describe('PostContent — Pantheon custom group interceptor', () => {
  const basePost = {
    id: 1, type: 'post' as const,
    title: { rendered: 'Test' }, excerpt: { rendered: '' },
    date: '2024-01-01T00:00:00', date_gmt: '2024-01-01T00:00:00',
    modified: '2024-01-01T00:00:00', modified_gmt: '2024-01-01T00:00:00',
    slug: 'test', status: 'publish' as const,
    link: 'https://example.com/test', author: 1, featured_media: 0,
    comment_status: 'open' as const, ping_status: 'open' as const,
    sticky: false, template: '', format: 'standard' as const,
    meta: {}, categories: [], tags: [],
  }

  const pantheonGroup = (href: string, title: string, description: string) =>
    `<div class="wp-block-group has-white-background-color has-background">` +
    `<p class="wp-embed-heading"><a href="${href}"><strong>${title}</strong></a></p>` +
    `<p class="has-base-color has-text-color" style="font-size:14px">${description}</p>` +
    `<p class="has-base-color has-text-color has-extra-small-font-size"><a href="https://pantheon.io">Pantheon</a></p>` +
    `</div>`

  it('renders the article title', () => {
    render(<PostContent post={{ ...basePost, content: { rendered:
      pantheonGroup('https://pantheon.io/blog/test', 'My Article Title', 'Article description here')
    }}} />)
    expect(screen.getByText('My Article Title')).toBeInTheDocument()
  })

  it('passes excerpt to ArticleCardWithImage for external links', () => {
    render(<PostContent post={{ ...basePost, content: { rendered:
      pantheonGroup('https://pantheon.io/blog/test', 'My Article', 'The article excerpt text')
    }}} />)
    expect(screen.getByTestId('article-excerpt')).toHaveTextContent('The article excerpt text')
  })

  it('shows the source name from the group DOM', () => {
    render(<PostContent post={{ ...basePost, content: { rendered:
      pantheonGroup('https://pantheon.io/blog/test', 'My Article', 'Excerpt')
    }}} />)
    expect(screen.getByTestId('article-source')).toHaveTextContent('Pantheon')
  })

  it('renders external link paragraphs as WPEmbedCard', () => {
    render(<PostContent post={{ ...basePost, content: { rendered:
      '<p class="wp-block-paragraph"><a href="https://eventespresso.com/2013/04/test/">Event Espresso: Test Article</a></p>'
    }}} />)
    expect(screen.getByTestId('wp-embed-card')).toBeInTheDocument()
    expect(screen.getByText('Event Espresso: Test Article')).toBeInTheDocument()
  })

  it('does not convert paragraphs with mixed content to WPEmbedCard', () => {
    render(<PostContent post={{ ...basePost, content: { rendered:
      '<p class="wp-block-paragraph">Some text with <a href="https://example.com">a link</a> inside.</p>'
    }}} />)
    expect(screen.queryByTestId('wp-embed-card')).not.toBeInTheDocument()
  })

  it('uses jazzsequence.com as source for internal /posts/ links', () => {
    // Simulate a local repost link that has already been rewritten to /posts/slug
    const internalGroup =
      `<div class="wp-block-group has-white-background-color has-background">` +
      `<p class="wp-embed-heading"><strong>WordPress 5.9: Full Site Editing Is Here</strong> ` +
      `(<a href="/posts/wordpress-5-9-full-site-editing-is-here/">local repost</a>)</p>` +
      `<p class="has-base-color has-text-color" style="font-size:14px">Full site editing coverage.</p>` +
      `<p class="has-base-color has-text-color has-extra-small-font-size"><a href="https://pantheon.io">Pantheon</a></p>` +
      `</div>`
    render(<PostContent post={{ ...basePost, content: { rendered: internalGroup }}} />)
    expect(screen.getByText('WordPress 5.9: Full Site Editing Is Here')).toBeInTheDocument()
    // Internal links override source to 'jazzsequence.com' — it's a local repost, not Pantheon
    // (ArticleCardWithImage mock renders sourceName as a span with data-testid="article-source")
    expect(screen.getByTestId('article-source')).toHaveTextContent('jazzsequence.com')
  })
});
