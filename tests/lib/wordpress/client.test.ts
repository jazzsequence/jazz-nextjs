import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import {
  fetchPost,
  fetchPosts,
  fetchPage,
  fetchPages,
  fetchGame,
  fetchGames,
  fetchRecipes,
  fetchArtists,
} from '../../../src/lib/wordpress/client'
import type { WPPost, WPPage, WPGame, WPRecipe, WPArtist } from '../../../src/lib/wordpress/types'

const API_URL = 'https://jazzsequence.com/wp-json/wp/v2'

describe('WordPress API Client', () => {
  describe('fetchPosts', () => {
    it('should fetch all posts successfully', async () => {
      const mockPosts: WPPost[] = [
        {
          id: 1,
          date: '2026-02-26T00:00:00',
          date_gmt: '2026-02-26T00:00:00',
          modified: '2026-02-26T00:00:00',
          modified_gmt: '2026-02-26T00:00:00',
          slug: 'test-post-1',
          status: 'publish',
          type: 'post',
          link: `${API_URL}/test-post-1`,
          title: { rendered: 'Test Post 1' },
          content: { rendered: '<p>Content 1</p>' },
          excerpt: { rendered: '<p>Excerpt 1</p>' },
          author: 1,
          featured_media: 0,
          comment_status: 'open',
          ping_status: 'closed',
          template: '',
          meta: {},
          sticky: false,
          format: 'standard',
          categories: [1],
          tags: [],
        },
      ]

      server.use(
        http.get(`${API_URL}/posts`, () => {
          return HttpResponse.json(mockPosts)
        })
      )

      const posts = await fetchPosts()
      expect(posts).toHaveLength(1)
      expect(posts[0].slug).toBe('test-post-1')
      expect(posts[0].type).toBe('post')
    })

    it('should fetch posts with pagination', async () => {
      server.use(
        http.get(`${API_URL}/posts`, ({ request }) => {
          const url = new URL(request.url)
          const page = url.searchParams.get('page')
          const perPage = url.searchParams.get('per_page')

          expect(page).toBe('2')
          expect(perPage).toBe('5')

          return HttpResponse.json([])
        })
      )

      await fetchPosts({ page: 2, perPage: 5 })
    })

    it('should handle API errors', async () => {
      server.use(
        http.get(`${API_URL}/posts`, () => {
          return HttpResponse.json(
            { code: 'rest_error', message: 'API Error' },
            { status: 500 }
          )
        })
      )

      await expect(fetchPosts()).rejects.toThrow('Failed to fetch posts')
    })

    it('should fetch posts with embed parameter', async () => {
      server.use(
        http.get(`${API_URL}/posts`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('_embed')).toBe('true')
          return HttpResponse.json([])
        })
      )

      await fetchPosts({ embed: true })
    })
  })

  describe('fetchPost', () => {
    it('should fetch a single post by slug', async () => {
      const mockPost: WPPost = {
        id: 1,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: `${API_URL}/test-post`,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Content</p>' },
        excerpt: { rendered: '<p>Excerpt</p>' },
        author: 1,
        featured_media: 0,
        comment_status: 'open',
        ping_status: 'closed',
        template: '',
        meta: {},
        sticky: false,
        format: 'standard',
        categories: [1],
        tags: [],
      }

      server.use(
        http.get(`${API_URL}/posts`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('slug')).toBe('test-post')
          return HttpResponse.json([mockPost])
        })
      )

      const post = await fetchPost('test-post')
      expect(post.slug).toBe('test-post')
      expect(post.title.rendered).toBe('Test Post')
    })

    it('should throw error if post not found', async () => {
      server.use(
        http.get(`${API_URL}/posts`, () => {
          return HttpResponse.json([])
        })
      )

      await expect(fetchPost('non-existent')).rejects.toThrow(
        'Post not found: non-existent'
      )
    })
  })

  describe('fetchPages', () => {
    it('should fetch all pages successfully', async () => {
      const mockPages: WPPage[] = [
        {
          id: 2,
          date: '2026-02-26T00:00:00',
          date_gmt: '2026-02-26T00:00:00',
          modified: '2026-02-26T00:00:00',
          modified_gmt: '2026-02-26T00:00:00',
          slug: 'about',
          status: 'publish',
          type: 'page',
          link: `${API_URL}/about`,
          title: { rendered: 'About' },
          content: { rendered: '<p>About content</p>' },
          excerpt: { rendered: '' },
          author: 1,
          featured_media: 0,
          comment_status: 'closed',
          ping_status: 'closed',
          template: '',
          meta: {},
          parent: 0,
          menu_order: 0,
        },
      ]

      server.use(
        http.get(`${API_URL}/pages`, () => {
          return HttpResponse.json(mockPages)
        })
      )

      const pages = await fetchPages()
      expect(pages).toHaveLength(1)
      expect(pages[0].type).toBe('page')
    })
  })

  describe('fetchPage', () => {
    it('should fetch a single page by slug', async () => {
      const mockPage: WPPage = {
        id: 2,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'about',
        status: 'publish',
        type: 'page',
        link: `${API_URL}/about`,
        title: { rendered: 'About' },
        content: { rendered: '<p>About content</p>' },
        excerpt: { rendered: '' },
        author: 1,
        featured_media: 0,
        comment_status: 'closed',
        ping_status: 'closed',
        template: '',
        meta: {},
        parent: 0,
        menu_order: 0,
      }

      server.use(
        http.get(`${API_URL}/pages`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('slug')).toBe('about')
          return HttpResponse.json([mockPage])
        })
      )

      const page = await fetchPage('about')
      expect(page.slug).toBe('about')
    })
  })

  describe('fetchGames', () => {
    it('should fetch all games from custom post type', async () => {
      const mockGames: WPGame[] = [
        {
          id: 3,
          date: '2026-02-26T00:00:00',
          date_gmt: '2026-02-26T00:00:00',
          modified: '2026-02-26T00:00:00',
          modified_gmt: '2026-02-26T00:00:00',
          slug: 'test-game',
          status: 'publish',
          type: 'gc_game',
          link: `${API_URL}/gc_game/test-game`,
          title: { rendered: 'Test Game' },
          content: { rendered: '<p>Game description</p>' },
          excerpt: { rendered: '' },
          author: 1,
          featured_media: 0,
          comment_status: 'closed',
          ping_status: 'closed',
          template: '',
          gc_attribute: [1, 2],
          meta: {
            gc_min_players: 2,
            gc_max_players: 4,
            gc_playing_time: 60,
            gc_age: 10,
          },
        },
      ]

      server.use(
        http.get(`${API_URL}/gc_game`, () => {
          return HttpResponse.json(mockGames)
        })
      )

      const games = await fetchGames()
      expect(games).toHaveLength(1)
      expect(games[0].type).toBe('gc_game')
      expect(games[0].meta.gc_min_players).toBe(2)
    })
  })

  describe('fetchGame', () => {
    it('should fetch a single game by slug', async () => {
      const mockGame: WPGame = {
        id: 3,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test-game',
        status: 'publish',
        type: 'gc_game',
        link: `${API_URL}/gc_game/test-game`,
        title: { rendered: 'Test Game' },
        content: { rendered: '<p>Game description</p>' },
        excerpt: { rendered: '' },
        author: 1,
        featured_media: 0,
        comment_status: 'closed',
        ping_status: 'closed',
        template: '',
        gc_attribute: [1, 2],
        meta: {
          gc_min_players: 2,
          gc_max_players: 4,
        },
      }

      server.use(
        http.get(`${API_URL}/gc_game`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('slug')).toBe('test-game')
          return HttpResponse.json([mockGame])
        })
      )

      const game = await fetchGame('test-game')
      expect(game.slug).toBe('test-game')
      expect(game.meta.gc_min_players).toBe(2)
    })
  })

  describe('fetchRecipes', () => {
    it('should fetch all recipes', async () => {
      const mockRecipes: WPRecipe[] = [
        {
          id: 4,
          date: '2026-02-26T00:00:00',
          date_gmt: '2026-02-26T00:00:00',
          modified: '2026-02-26T00:00:00',
          modified_gmt: '2026-02-26T00:00:00',
          slug: 'test-recipe',
          status: 'publish',
          type: 'rb_recipe',
          link: `${API_URL}/rb_recipe/test-recipe`,
          title: { rendered: 'Test Recipe' },
          content: { rendered: '<p>Recipe</p>' },
          excerpt: { rendered: '' },
          author: 1,
          featured_media: 0,
          comment_status: 'closed',
          ping_status: 'closed',
          template: '',
          rb_recipe_category: [1],
          rb_meal_type: [2],
          rb_recipe_cuisine: [3],
          meta: {
            rb_servings: 4,
          },
        },
      ]

      server.use(
        http.get(`${API_URL}/rb_recipe`, () => {
          return HttpResponse.json(mockRecipes)
        })
      )

      const recipes = await fetchRecipes()
      expect(recipes).toHaveLength(1)
      expect(recipes[0].type).toBe('rb_recipe')
    })
  })

  describe('fetchArtists', () => {
    it('should fetch all artists', async () => {
      const mockArtists: WPArtist[] = [
        {
          id: 5,
          date: '2026-02-26T00:00:00',
          date_gmt: '2026-02-26T00:00:00',
          modified: '2026-02-26T00:00:00',
          modified_gmt: '2026-02-26T00:00:00',
          slug: 'test-artist',
          status: 'publish',
          type: 'plague-artist',
          link: `${API_URL}/plague-artist/test-artist`,
          title: { rendered: 'Test Artist' },
          content: { rendered: '<p>Bio</p>' },
          excerpt: { rendered: '' },
          author: 1,
          featured_media: 0,
          comment_status: 'closed',
          ping_status: 'closed',
          template: '',
          meta: {
            artist_website: 'https://example.com',
          },
        },
      ]

      server.use(
        http.get(`${API_URL}/plague-artist`, () => {
          return HttpResponse.json(mockArtists)
        })
      )

      const artists = await fetchArtists()
      expect(artists).toHaveLength(1)
      expect(artists[0].type).toBe('plague-artist')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_URL}/posts`, () => {
          return HttpResponse.error()
        })
      )

      await expect(fetchPosts()).rejects.toThrow()
    })

    it('should handle malformed JSON', async () => {
      server.use(
        http.get(`${API_URL}/posts`, () => {
          return new HttpResponse('invalid json', {
            headers: { 'Content-Type': 'application/json' },
          })
        })
      )

      await expect(fetchPosts()).rejects.toThrow()
    })
  })

  describe('Query Parameters', () => {
    it('should build correct query string with multiple parameters', async () => {
      server.use(
        http.get(`${API_URL}/posts`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('page')).toBe('2')
          expect(url.searchParams.get('per_page')).toBe('10')
          expect(url.searchParams.get('_embed')).toBe('true')
          expect(url.searchParams.get('categories')).toBe('1,2,3')
          return HttpResponse.json([])
        })
      )

      await fetchPosts({
        page: 2,
        perPage: 10,
        embed: true,
        categories: [1, 2, 3],
      })
    })

    it('should handle search parameter', async () => {
      server.use(
        http.get(`${API_URL}/posts`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('search')).toBe('test query')
          return HttpResponse.json([])
        })
      )

      await fetchPosts({ search: 'test query' })
    })
  })
})
