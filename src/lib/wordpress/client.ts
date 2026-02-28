/**
 * Enhanced WordPress REST API Client
 * Features: Retry logic, rate limiting, Zod validation, ISR caching
 */

import type { z } from 'zod'
import {
  WPPostSchema,
  WPPostsSchema,
  WPPageSchema,
  WPPagesSchema,
  WPGameSchema,
  WPGamesSchema,
  WPRecipeSchema,
  WPRecipesSchema,
  WPMediaSchema,
  WPMediaItemsSchema,
  WPArtistSchema,
  WPArtistsSchema,
  WPMovieSchema,
  WPMoviesSchema,
  WPAddressSchema,
  WPAddressesSchema,
} from './schemas'
import type {
  WPPost,
  WPPage,
  WPGame,
  WPRecipe,
  WPMedia,
  WPArtist,
  WPMovie,
  WPAddress,
  WPAPIListResponse,
} from './types'

// ===== Configuration =====

const API_BASE_URL =
  process.env.WORDPRESS_API_URL || 'https://jazzsequence.com/wp-json/wp/v2'

// ===== Custom Error Classes =====

export class WPAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'WPAPIError'
  }
}

export class WPValidationError extends Error {
  constructor(
    message: string,
    public zodError: z.ZodError
  ) {
    super(message)
    this.name = 'WPValidationError'
  }
}

export class WPNotFoundError extends WPAPIError {
  constructor(type: string, slug: string) {
    super(`${type} not found: ${slug}`, 404)
    this.name = 'WPNotFoundError'
  }
}

export class WPRateLimitError extends WPAPIError {
  constructor() {
    super('Rate limit exceeded', 429)
    this.name = 'WPRateLimitError'
  }
}

// ===== ISR Options =====

export interface ISROptions {
  revalidate?: number | false
  tags?: string[]
  cache?: RequestCache
}

export interface FetchOptions {
  page?: number
  perPage?: number
  embed?: boolean
  search?: string
  categories?: number[]
  tags?: number[]
  orderBy?: 'date' | 'title' | 'modified'
  order?: 'asc' | 'desc'
  isr?: ISROptions
  cache?: ISROptions // Alias for isr
}

// ===== Retry Configuration =====

interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableStatusCodes: number[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

// ===== Utility Functions =====

/**
 * Sleep utility for delays
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt)
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)
  // Add jitter (±20%) to prevent thundering herd
  const jitter = cappedDelay * 0.2 * (Math.random() - 0.5)
  return Math.round(cappedDelay + jitter)
}

// ===== Rate Limiting =====

/**
 * Token bucket rate limiter
 * - Allows burst traffic up to bucket size
 * - Refills tokens at constant rate
 */
class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens
    this.refillRate = refillRate
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }

  async tryAcquire(): Promise<void> {
    this.refillTokens()

    if (this.tokens >= 1) {
      this.tokens -= 1
      return
    }

    // Wait for next token
    const waitTimeMs = (1 / this.refillRate) * 1000
    await sleep(waitTimeMs)
    this.refillTokens()
    this.tokens -= 1
  }

  private refillTokens(): void {
    const now = Date.now()
    const elapsedSeconds = (now - this.lastRefill) / 1000
    const tokensToAdd = elapsedSeconds * this.refillRate

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}

// Global rate limiter instance (10 requests/sec, burst of 20)
const rateLimiter = new TokenBucketRateLimiter(20, 10)

// ===== Fetch Infrastructure =====

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      // Success
      if (response.ok) {
        return response
      }

      // Check if status is retryable
      if (!retryConfig.retryableStatusCodes.includes(response.status)) {
        throw new WPAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        )
      }

      lastError = new WPAPIError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url
      )

      // Don't sleep after last attempt
      if (attempt < retryConfig.maxRetries - 1) {
        const delay = calculateBackoffDelay(attempt, retryConfig)
        await sleep(delay)
      }
    } catch (error) {
      // If it's a WPAPIError from non-retryable status, re-throw immediately
      if (error instanceof WPAPIError && !retryConfig.retryableStatusCodes.includes(error.statusCode || 0)) {
        throw error
      }

      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry on last attempt
      if (attempt === retryConfig.maxRetries - 1) {
        throw lastError
      }

      const delay = calculateBackoffDelay(attempt, retryConfig)
      await sleep(delay)
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * Fetch and validate response with Zod schema
 */
async function fetchAndValidate<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<z.infer<T>> {
  // Rate limit
  await rateLimiter.tryAcquire()

  // Fetch with retry
  const response = await fetchWithRetry(url, options, retryConfig)

  // Parse JSON
  const data = await response.json()

  // Validate with Zod
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new WPValidationError(
      `Validation failed for ${url}`,
      result.error
    )
  }

  return result.data
}

/**
 * Build query parameters from options
 */
function buildQueryParams(options: Omit<FetchOptions, 'isr'> = {}): string {
  const params = new URLSearchParams()

  if (options.page) params.append('page', options.page.toString())
  if (options.perPage) params.append('per_page', options.perPage.toString())
  if (options.embed) params.append('_embed', 'true')
  if (options.search) params.append('search', options.search)
  if (options.categories)
    params.append('categories', options.categories.join(','))
  if (options.tags) params.append('tags', options.tags.join(','))
  if (options.orderBy) params.append('orderby', options.orderBy)
  if (options.order) params.append('order', options.order)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Build Next.js cache options for fetch
 */
function buildISROptions(options: ISROptions = {}): RequestInit {
  const cacheOptions: RequestInit = {}

  if (options.revalidate !== undefined || options.tags) {
    cacheOptions.next = {
      ...(options.revalidate !== undefined && { revalidate: options.revalidate }),
      ...(options.tags && { tags: options.tags }),
    }
  }

  if (options.cache !== undefined) {
    cacheOptions.cache = options.cache
  }

  return cacheOptions
}

/**
 * Create cache tags for content type
 */
export function createCacheTags(
  type: string,
  slug?: string,
  additionalTags: string[] = []
): string[] {
  const tags = [type]
  if (slug) {
    tags.push(`${type}:${slug}`)
  }
  return [...tags, ...additionalTags]
}

// ===== Post Type Configuration =====

interface PostTypeConfig<T> {
  endpoint: string      // e.g., 'gc_game', 'rb_recipe'
  displayName: string   // e.g., 'Game', 'Recipe'
  schema: z.ZodType<T>  // Zod schema for single item
  arraySchema: z.ZodType<T[]> // Zod schema for array
}

// Post type configurations
const POST_CONFIG: PostTypeConfig<WPPost> = {
  endpoint: 'posts',
  displayName: 'Post',
  schema: WPPostSchema,
  arraySchema: WPPostsSchema,
}

const PAGE_CONFIG: PostTypeConfig<WPPage> = {
  endpoint: 'pages',
  displayName: 'Page',
  schema: WPPageSchema,
  arraySchema: WPPagesSchema,
}

const GAME_CONFIG: PostTypeConfig<WPGame> = {
  endpoint: 'gc_game',
  displayName: 'Game',
  schema: WPGameSchema,
  arraySchema: WPGamesSchema,
}

const RECIPE_CONFIG: PostTypeConfig<WPRecipe> = {
  endpoint: 'rb_recipe',
  displayName: 'Recipe',
  schema: WPRecipeSchema,
  arraySchema: WPRecipesSchema,
}

const MEDIA_CONFIG: PostTypeConfig<WPMedia> = {
  endpoint: 'media',
  displayName: 'Media',
  schema: WPMediaSchema,
  arraySchema: WPMediaItemsSchema,
}

const ARTIST_CONFIG: PostTypeConfig<WPArtist> = {
  endpoint: 'plague-artist',
  displayName: 'Artist',
  schema: WPArtistSchema,
  arraySchema: WPArtistsSchema,
}

const MOVIE_CONFIG: PostTypeConfig<WPMovie> = {
  endpoint: 'movie',
  displayName: 'Movie',
  schema: WPMovieSchema,
  arraySchema: WPMoviesSchema,
}

const ADDRESS_CONFIG: PostTypeConfig<WPAddress> = {
  endpoint: 'ab_address',
  displayName: 'Address',
  schema: WPAddressSchema,
  arraySchema: WPAddressesSchema,
}

// Post type configuration map
const POST_TYPE_CONFIGS: Record<string, PostTypeConfig<any>> = {
  posts: POST_CONFIG,
  pages: PAGE_CONFIG,
  gc_game: GAME_CONFIG,
  rb_recipe: RECIPE_CONFIG,
  media: MEDIA_CONFIG,
  'plague-artist': ARTIST_CONFIG,
  movie: MOVIE_CONFIG,
  ab_address: ADDRESS_CONFIG,
}

// ===== Generic Functions (WordPress-native naming) =====

/**
 * Internal DRY helper using PostTypeConfig
 */
async function fetchPostTypeList<T>(
  config: PostTypeConfig<T>,
  options: FetchOptions = {}
): Promise<WPAPIListResponse<T>> {
  const { isr, cache, ...fetchOpts } = options
  const queryParams = buildQueryParams(fetchOpts)
  const url = `${API_BASE_URL}/${config.endpoint}${queryParams}`

  // Auto-generate cache tags if ISR enabled but no tags provided
  const isrOptions = cache || isr || {}
  if (isrOptions.revalidate !== undefined && !isrOptions.tags) {
    isrOptions.tags = createCacheTags(config.endpoint)
  }

  const cacheOptions = buildISROptions(isrOptions)

  try {
    return await fetchAndValidate(url, config.arraySchema, cacheOptions)
  } catch (error) {
    // Re-throw validation errors as-is (preserve "validation" in message)
    if (error instanceof WPValidationError) {
      throw error
    }

    // Use lowercase plural for error messages (e.g., "posts", "pages")
    const errorType = config.endpoint === 'posts' ? 'posts'
      : config.endpoint === 'pages' ? 'pages'
      : config.endpoint === 'gc_game' ? 'games'
      : config.endpoint === 'rb_recipe' ? 'recipes'
      : config.endpoint === 'plague-artist' ? 'artists'
      : config.endpoint === 'movie' ? 'movies'
      : config.endpoint === 'media' ? 'media'
      : config.endpoint === 'ab_address' ? 'addresses'
      : config.endpoint

    // Preserve status code if it's a WPAPIError
    const statusCode = error instanceof WPAPIError ? error.statusCode : undefined

    throw new WPAPIError(
      `Failed to fetch ${errorType}`,
      statusCode,
      config.endpoint
    )
  }
}

/**
 * Generic wrapper for single item (internal DRY helper)
 */
async function fetchPostTypeItem<T>(
  config: PostTypeConfig<T>,
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<T> {
  const { isr, cache, ...fetchOpts } = options
  const queryParams = buildQueryParams(fetchOpts)
  const baseQuery = queryParams ? `&${queryParams.slice(1)}` : ''
  const url = `${API_BASE_URL}/${config.endpoint}?slug=${slug}${baseQuery}`

  // Auto-generate cache tags if ISR enabled but no tags provided
  const isrOptions = cache || isr || {}
  if (isrOptions.revalidate !== undefined && !isrOptions.tags) {
    isrOptions.tags = createCacheTags(config.endpoint, slug)
  }

  const cacheOptions = buildISROptions(isrOptions)

  try {
    const data = await fetchAndValidate(url, config.arraySchema, cacheOptions)

    if (!data.length) {
      throw new WPNotFoundError(config.displayName, slug)
    }

    return data[0]
  } catch (error) {
    // Re-throw specific error types as-is
    if (error instanceof WPNotFoundError) {
      throw error
    }
    if (error instanceof WPValidationError) {
      throw error
    }

    // Use lowercase singular for error messages
    const errorType = config.endpoint === 'posts' ? 'post'
      : config.endpoint === 'pages' ? 'page'
      : config.endpoint === 'gc_game' ? 'game'
      : config.endpoint === 'rb_recipe' ? 'recipe'
      : config.endpoint === 'plague-artist' ? 'artist'
      : config.endpoint === 'movie' ? 'movie'
      : config.endpoint === 'media' ? 'media item'
      : config.endpoint === 'ab_address' ? 'address'
      : config.endpoint

    // Preserve status code if it's a WPAPIError
    const statusCode = error instanceof WPAPIError ? error.statusCode : undefined

    throw new WPAPIError(
      `Failed to fetch ${errorType}`,
      statusCode,
      config.endpoint
    )
  }
}

// ===== Public API Functions =====

/**
 * Fetch list of posts from any post type
 * @param postType - Post type endpoint (e.g., 'posts', 'gc_game', 'rb_recipe')
 * @param options - Fetch options (pagination, search, ISR, etc.)
 */
export async function fetchPosts<T = any>(
  postType: string,
  options: FetchOptions = {}
): Promise<WPAPIListResponse<T>> {
  const config = POST_TYPE_CONFIGS[postType]
  if (!config) {
    throw new WPAPIError(
      `Unknown post type: ${postType}`,
      undefined,
      postType
    )
  }
  return fetchPostTypeList(config, options)
}

/**
 * Fetch single post by slug from any post type
 * @param postType - Post type endpoint (e.g., 'posts', 'gc_game', 'rb_recipe')
 * @param slug - Post slug
 * @param options - Fetch options (pagination, embed, ISR, etc.)
 */
export async function fetchPost<T = any>(
  postType: string,
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<T> {
  const config = POST_TYPE_CONFIGS[postType]
  if (!config) {
    throw new WPAPIError(
      `Unknown post type: ${postType}`,
      undefined,
      postType
    )
  }
  return fetchPostTypeItem(config, slug, options)
}
