import { describe, it, expect } from 'vitest'
import type {
  WPPost,
  WPPage,
  WPGame,
  WPRecipe,
  WPArtist,
  WPCategory,
  WPTag,
  WPAPIError,
} from './types'

describe('WordPress Types', () => {
  describe('WPPost', () => {
    it('should accept a valid post object', () => {
      const post: WPPost = {
        id: 1,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post',
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

      expect(post.type).toBe('post')
      expect(post.sticky).toBe(false)
    })

    it('should enforce type literal for post type', () => {
      const post: WPPost = {
        id: 1,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test',
        status: 'publish',
        type: 'post', // Must be exactly 'post'
        link: 'https://example.com',
        title: { rendered: 'Test' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
        author: 1,
        featured_media: 0,
        comment_status: 'open',
        ping_status: 'open',
        template: '',
        meta: {},
        sticky: false,
        format: 'standard',
        categories: [],
        tags: [],
      }

      expect(post.type).toBe('post')
    })
  })

  describe('WPPage', () => {
    it('should accept a valid page object', () => {
      const page: WPPage = {
        id: 2,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test-page',
        status: 'publish',
        type: 'page',
        link: 'https://example.com/test-page',
        title: { rendered: 'Test Page' },
        content: { rendered: '<p>Page Content</p>' },
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

      expect(page.type).toBe('page')
      expect(page.parent).toBe(0)
    })
  })

  describe('WPGame', () => {
    it('should accept a valid game object with metadata', () => {
      const game: WPGame = {
        id: 3,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test-game',
        status: 'publish',
        type: 'gc_game',
        link: 'https://example.com/games/test-game',
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
          gc_difficulty: 'medium',
        },
      }

      expect(game.type).toBe('gc_game')
      expect(game.meta.gc_min_players).toBe(2)
      expect(game.meta.gc_max_players).toBe(4)
    })
  })

  describe('WPRecipe', () => {
    it('should accept a valid recipe object with ingredients', () => {
      const recipe: WPRecipe = {
        id: 4,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test-recipe',
        status: 'publish',
        type: 'rb_recipe',
        link: 'https://example.com/recipes/test-recipe',
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
          rb_ingredients: ['2 cups flour', '1 cup sugar'],
          rb_instructions: 'Mix and bake',
          rb_prep_time: '15 minutes',
          rb_cook_time: '30 minutes',
          rb_servings: 8,
        },
      }

      expect(recipe.type).toBe('rb_recipe')
      expect(recipe.meta.rb_servings).toBe(8)
    })
  })

  describe('WPArtist', () => {
    it('should accept a valid artist object with social links', () => {
      const artist: WPArtist = {
        id: 5,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test-artist',
        status: 'publish',
        type: 'plague-artist',
        link: 'https://example.com/artists/test-artist',
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
          artist_bandcamp: 'https://bandcamp.com/artist',
          artist_soundcloud: 'https://soundcloud.com/artist',
        },
      }

      expect(artist.type).toBe('plague-artist')
      expect(artist.meta.artist_website).toBe('https://example.com')
    })
  })

  describe('WPCategory', () => {
    it('should accept a valid category object', () => {
      const category: WPCategory = {
        id: 1,
        count: 10,
        description: 'Test category',
        link: 'https://example.com/category/test',
        name: 'Test',
        slug: 'test',
        taxonomy: 'category',
        parent: 0,
        meta: {},
      }

      expect(category.taxonomy).toBe('category')
      expect(category.count).toBe(10)
    })
  })

  describe('WPTag', () => {
    it('should accept a valid tag object', () => {
      const tag: WPTag = {
        id: 2,
        count: 5,
        description: 'Test tag',
        link: 'https://example.com/tag/test',
        name: 'Test Tag',
        slug: 'test-tag',
        taxonomy: 'post_tag',
        meta: {},
      }

      expect(tag.taxonomy).toBe('post_tag')
      expect(tag.count).toBe(5)
    })
  })

  describe('WPAPIError', () => {
    it('should accept a valid error object', () => {
      const error: WPAPIError = {
        code: 'rest_post_invalid_id',
        message: 'Invalid post ID.',
        data: {
          status: 404,
        },
      }

      expect(error.code).toBe('rest_post_invalid_id')
      expect(error.data.status).toBe(404)
    })
  })

  describe('Type Safety', () => {
    it('should not allow any type for meta fields', () => {
      // This should compile since we use Record<string, unknown>
      const post: WPPost = {
        id: 1,
        date: '2026-02-26T00:00:00',
        date_gmt: '2026-02-26T00:00:00',
        modified: '2026-02-26T00:00:00',
        modified_gmt: '2026-02-26T00:00:00',
        slug: 'test',
        status: 'publish',
        type: 'post',
        link: 'https://example.com',
        title: { rendered: 'Test' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
        author: 1,
        featured_media: 0,
        comment_status: 'open',
        ping_status: 'open',
        template: '',
        meta: {
          custom_field: 'value',
          another_field: 123,
          nested: { data: true },
        },
        sticky: false,
        format: 'standard',
        categories: [],
        tags: [],
      }

      expect(post.meta).toBeDefined()
      expect(typeof post.meta).toBe('object')
    })
  })
})
