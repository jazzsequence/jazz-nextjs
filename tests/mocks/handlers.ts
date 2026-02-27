import { http, HttpResponse } from 'msw'
import { mockPosts, mockPages } from './wordpress-data'

const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://jazzsequence.com/wp-json/wp/v2'

export const handlers = [
  // Get posts
  http.get(`${WORDPRESS_API_URL}/posts`, () => {
    return HttpResponse.json(mockPosts)
  }),

  // Get single post
  http.get(`${WORDPRESS_API_URL}/posts/:id`, ({ params }) => {
    const { id } = params
    const post = mockPosts.find((p) => p.id === Number(id))
    return post ? HttpResponse.json(post) : new HttpResponse(null, { status: 404 })
  }),

  // Get posts by slug
  http.get(`${WORDPRESS_API_URL}/posts`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug) {
      const post = mockPosts.find((p) => p.slug === slug)
      return post ? HttpResponse.json([post]) : HttpResponse.json([])
    }

    return HttpResponse.json(mockPosts)
  }),

  // Get pages
  http.get(`${WORDPRESS_API_URL}/pages`, () => {
    return HttpResponse.json(mockPages)
  }),

  // Get single page
  http.get(`${WORDPRESS_API_URL}/pages/:id`, ({ params }) => {
    const { id } = params
    const page = mockPages.find((p) => p.id === Number(id))
    return page ? HttpResponse.json(page) : new HttpResponse(null, { status: 404 })
  }),

  // Get pages by slug
  http.get(`${WORDPRESS_API_URL}/pages`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug) {
      const page = mockPages.find((p) => p.slug === slug)
      return page ? HttpResponse.json([page]) : HttpResponse.json([])
    }

    return HttpResponse.json(mockPages)
  }),

  // Get categories
  http.get(`${WORDPRESS_API_URL}/categories`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Uncategorized', slug: 'uncategorized' },
      { id: 2, name: 'Technology', slug: 'technology' },
      { id: 3, name: 'Design', slug: 'design' },
    ])
  }),

  // Get tags
  http.get(`${WORDPRESS_API_URL}/tags`, () => {
    return HttpResponse.json([
      { id: 1, name: 'JavaScript', slug: 'javascript' },
      { id: 2, name: 'React', slug: 'react' },
      { id: 3, name: 'Next.js', slug: 'nextjs' },
    ])
  }),
]
