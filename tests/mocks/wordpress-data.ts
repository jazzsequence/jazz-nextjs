/**
 * Mock WordPress REST API response data for testing
 */

export const mockPost = {
  id: 1,
  date: '2026-02-26T12:00:00',
  date_gmt: '2026-02-26T12:00:00',
  modified: '2026-02-26T12:00:00',
  modified_gmt: '2026-02-26T12:00:00',
  slug: 'test-post',
  status: 'publish',
  type: 'post',
  link: 'https://jazzsequence.com/test-post',
  title: {
    rendered: 'Test Post',
  },
  content: {
    rendered: '<p>This is a test post content.</p>',
    protected: false,
  },
  excerpt: {
    rendered: '<p>This is a test excerpt.</p>',
    protected: false,
  },
  author: 1,
  featured_media: 0,
  comment_status: 'open',
  ping_status: 'open',
  sticky: false,
  template: '',
  format: 'standard',
  meta: [],
  categories: [1],
  tags: [],
  _embedded: {
    author: [
      {
        id: 1,
        name: 'Test Author',
        url: '',
        description: '',
        link: 'https://jazzsequence.com/author/test',
        slug: 'test',
        avatar_urls: {
          '24': '',
          '48': '',
          '96': '',
        },
      },
    ],
  },
}

export const mockPosts = [
  mockPost,
  {
    ...mockPost,
    id: 2,
    slug: 'second-post',
    title: { rendered: 'Second Post' },
    excerpt: { rendered: '<p>Second post excerpt.</p>', protected: false },
  },
  {
    ...mockPost,
    id: 3,
    slug: 'third-post',
    title: { rendered: 'Third Post' },
    excerpt: { rendered: '<p>Third post excerpt.</p>', protected: false },
  },
]

export const mockPage = {
  id: 1,
  date: '2026-02-26T12:00:00',
  date_gmt: '2026-02-26T12:00:00',
  modified: '2026-02-26T12:00:00',
  modified_gmt: '2026-02-26T12:00:00',
  slug: 'about',
  status: 'publish',
  type: 'page',
  link: 'https://jazzsequence.com/about',
  title: {
    rendered: 'About',
  },
  content: {
    rendered: '<p>This is the about page content.</p>',
    protected: false,
  },
  excerpt: {
    rendered: '<p>About page excerpt.</p>',
    protected: false,
  },
  author: 1,
  featured_media: 0,
  comment_status: 'closed',
  ping_status: 'closed',
  template: '',
  meta: [],
  parent: 0,
  menu_order: 0,
}

export const mockPages = [
  mockPage,
  {
    ...mockPage,
    id: 2,
    slug: 'contact',
    title: { rendered: 'Contact' },
    content: { rendered: '<p>Contact page content.</p>', protected: false },
  },
]
