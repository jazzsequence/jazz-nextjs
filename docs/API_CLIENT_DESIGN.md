# WordPress API Client Design Document

**Status**: ✅ Implemented
**Last Updated**: 2026-03-27
**Implementation**: `src/lib/wordpress/client.ts`
**Tests**: `tests/lib/wordpress/client.test.ts`

## Overview

The WordPress API client provides a robust, type-safe interface to the WordPress REST API with runtime validation, automatic retries, rate limiting, and Next.js ISR integration.

## Architecture

### Core Features

1. **Zod Runtime Validation** - All responses validated against schemas
2. **Retry Logic** - Exponential backoff with jitter for transient failures
3. **Rate Limiting** - Token bucket algorithm (10 req/sec, burst of 20)
4. **ISR Integration** - Automatic cache tag generation for Next.js
5. **Generic API** - Single API for all post types with type safety
6. **Error Handling** - Custom error classes with detailed context

## Core Infrastructure

### Retry Logic with Exponential Backoff

```typescript
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
```

**Features:**
- Exponential backoff: 1s → 2s → 4s (capped at 5s)
- Jitter (±20%) prevents thundering herd
- Only retries transient errors (408, 429, 5xx)
- Non-retryable errors (404, 400) fail immediately

### Rate Limiting

```typescript
class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number        // 20 (burst capacity)
  private readonly refillRate: number       // 10 tokens/sec

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
```

**Configuration:**
- **Burst capacity**: 20 requests
- **Sustained rate**: 10 requests/sec
- **Algorithm**: Token bucket (allows bursts, smooth sustained traffic)

### Validation Layer

```typescript
async function fetchAndValidate<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<z.infer<T>> {
  // 1. Rate limit
  await rateLimiter.tryAcquire()

  // 2. Fetch with retry
  const response = await fetchWithRetry(url, options, retryConfig)

  // 3. Parse JSON
  const data = await response.json()

  // 4. Validate with Zod
  const result = schema.safeParse(data)

  if (!result.success) {
    throw new WPValidationError(
      `Validation failed for ${url}`,
      result.error
    )
  }

  return result.data
}
```

## Generic Post Type System

### Post Type Configuration

```typescript
interface PostTypeConfig<T> {
  endpoint: string      // e.g., 'gc_game', 'rb_recipe'
  displayName: string   // e.g., 'Game', 'Recipe'
  schema: z.ZodType<T>  // Zod schema for single item
  arraySchema: z.ZodType<T[]> // Zod schema for array
}

const POST_TYPE_CONFIGS: Record<string, PostTypeConfig<any>> = {
  posts: {
    endpoint: 'posts',
    displayName: 'Post',
    schema: WPPostSchema,
    arraySchema: WPPostsSchema,
  },
  pages: {
    endpoint: 'pages',
    displayName: 'Page',
    schema: WPPageSchema,
    arraySchema: WPPagesSchema,
  },
  gc_game: {
    endpoint: 'gc_game',
    displayName: 'Game',
    schema: WPGameSchema,
    arraySchema: WPGamesSchema,
  },
  rb_recipe: {
    endpoint: 'rb_recipe',
    displayName: 'Recipe',
    schema: WPRecipeSchema,
    arraySchema: WPRecipesSchema,
  },
  media: {
    endpoint: 'media-items',
    displayName: 'Media',
    schema: WPMediaSchema,
    arraySchema: WPMediaItemsSchema,
  },
  'plague-artist': {
    endpoint: 'plague-artist',
    displayName: 'Artist',
    schema: WPArtistSchema,
    arraySchema: WPArtistsSchema,
  },
  movie: {
    endpoint: 'movie',
    displayName: 'Movie',
    schema: WPMovieSchema,
    arraySchema: WPMoviesSchema,
  },
  ab_address: {
    endpoint: 'ab_address',
    displayName: 'Address',
    schema: WPAddressSchema,
    arraySchema: WPAddressesSchema,
  },
}
```

### Internal DRY Helpers

```typescript
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
    if (error instanceof WPValidationError) {
      throw error
    }

    const statusCode = error instanceof WPAPIError ? error.statusCode : undefined
    throw new WPAPIError(
      `Failed to fetch ${errorType}`,
      statusCode,
      config.endpoint
    )
  }
}

async function fetchPostTypeItem<T>(
  config: PostTypeConfig<T>,
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<T> {
  const { isr, cache, ...fetchOpts } = options
  const queryParams = buildQueryParams(fetchOpts)
  const url = `${API_BASE_URL}/${config.endpoint}?slug=${slug}${queryParams}`

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
    if (error instanceof WPNotFoundError || error instanceof WPValidationError) {
      throw error
    }

    const statusCode = error instanceof WPAPIError ? error.statusCode : undefined
    throw new WPAPIError(
      `Failed to fetch ${errorType}`,
      statusCode,
      config.endpoint
    )
  }
}
```

## Public API

### Generic Functions

```typescript
/**
 * Fetch list of posts from any post type
 * @param postType - Post type endpoint (e.g., 'posts', 'gc_game', 'rb_recipe')
 * @param options - Fetch options (pagination, search, ISR, etc.)
 */
export async function fetchPosts<T = WPContent>(
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
export async function fetchPost<T = WPContent>(
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
```

```typescript
/**
 * Fetch list of posts with pagination metadata
 * @param postType - Post type endpoint (e.g., 'posts', 'gc_game')
 * @param options - Fetch options (pagination, search, ISR, etc.)
 * @returns PaginatedResponse with data, totalItems, totalPages, currentPage
 */
export async function fetchPostsWithPagination<T = WPContent>(
  postType: string,
  options: FetchOptions = {}
): Promise<PaginatedResponse<T>>
```

### Usage Examples

```typescript
// Fetch posts with pagination
const posts = await fetchPosts('posts', { page: 1, perPage: 10 })

// Fetch games with search
const games = await fetchPosts('gc_game', { search: 'monopoly' })

// Fetch recipes with ISR caching (auto-generates tags: ['rb_recipe'])
const recipes = await fetchPosts('rb_recipe', {
  isr: { revalidate: 3600 }
})

// Fetch single post
const post = await fetchPost('posts', 'my-post-slug')

// Fetch single game with custom cache tags
const game = await fetchPost('gc_game', 'monopoly', {
  cache: { revalidate: 7200, tags: ['games', 'featured'] }
})

// Disable caching
const liveData = await fetchPosts('posts', {
  cache: { cache: 'no-cache' }
})
```

## ISR Integration

### Options Interface

```typescript
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
  cache?: ISROptions  // Alias for isr
}
```

### Cache Tag Generation

```typescript
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

// Examples:
createCacheTags('posts')              // ['posts']
createCacheTags('posts', 'my-slug')   // ['posts', 'posts:my-slug']
createCacheTags('gc_game', 'monopoly', ['featured'])  // ['gc_game', 'gc_game:monopoly', 'featured']
```

### Next.js Configuration

```typescript
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
```

## Error Handling

### Error Classes

```typescript
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

export class WPForbiddenError extends WPAPIError {
  constructor(type: string, slug: string) {
    super(`${type} access forbidden: ${slug}`, 403)
    this.name = 'WPForbiddenError'
  }
}
```

### Error Handling Examples

```typescript
try {
  const post = await fetchPost('posts', 'nonexistent')
} catch (error) {
  if (error instanceof WPNotFoundError) {
    console.log('Post not found:', error.message)
  } else if (error instanceof WPValidationError) {
    console.log('Invalid response:', error.zodError)
  } else if (error instanceof WPAPIError) {
    console.log('API error:', error.statusCode, error.message)
  }
}
```

## Testing

### Test Coverage

**Type Tests**
- Schema validation for all post types
- Required vs optional fields
- Custom post type metadata

**Client Tests**
- Fetch operations (posts, pages, games, recipes, artists, movies, media, addresses)
- Error handling (404, 429, 500, network failures)
- Retry logic with exponential backoff
- Rate limiting
- ISR caching integration
- Edge cases (empty arrays, long content, Unicode, malformed responses)

### Test Infrastructure

```typescript
// tests/setup.ts
afterEach(() => {
  server.resetHandlers()    // Reset MSW handlers
  resetRateLimiter()        // Reset rate limiter state
  cleanup()                 // React Testing Library cleanup
  vi.restoreAllMocks()      // Restore all Vitest mocks
})
```

### Rate Limiter Testing

```typescript
// Export for testing
export function resetRateLimiter(): void {
  rateLimiter['tokens'] = rateLimiter['maxTokens']
  rateLimiter['lastRefill'] = Date.now()
}
```

## Performance

### Bundle Size
- Zod schemas: ~10KB gzipped
- Rate limiter: ~1KB
- Retry logic: ~2KB
- **Total overhead**: ~13KB gzipped

### Runtime Performance
- Zod validation: ~1-5ms per object
- Rate limiting: <1ms overhead
- Retry logic: Only on failures
- **Impact**: <10ms per request

### Memory Usage
- Token bucket: O(1) memory
- Zod schemas: Shared across validations
- **Impact**: Negligible

## Design Decisions

### Why Generic API?

Instead of type-specific functions (`fetchGames`, `fetchRecipes`), we use:
```typescript
fetchPosts(postType, options)
fetchPost(postType, slug, options)
```

**Benefits:**
- Zero code duplication
- Trivial to add new post types (add config only)
- Consistent API across all content
- Full type safety via config system
- Smaller bundle size

### Why Token Bucket Rate Limiting?

- Allows burst traffic (20 requests instantly)
- Smooth sustained rate (10 req/sec)
- Prevents API overload
- Self-regulating (no external state)

### Why Auto-Generated Cache Tags?

```typescript
// Auto-tags: ['posts']
fetchPosts('posts', { isr: { revalidate: 3600 } })

// Auto-tags: ['posts', 'posts:my-slug']
fetchPost('posts', 'my-slug', { isr: { revalidate: 3600 } })
```

**Benefits:**
- Sensible defaults
- Can override with custom tags
- Consistent tagging strategy
- Easy cache invalidation

## Adding New Post Types

1. Add Zod schemas to `schemas.ts`
2. Add TypeScript types to `types.ts`
3. Add config to `POST_TYPE_CONFIGS` in `client.ts`

```typescript
const NEW_TYPE_CONFIG: PostTypeConfig<WPNewType> = {
  endpoint: 'new_type',
  displayName: 'New Type',
  schema: WPNewTypeSchema,
  arraySchema: WPNewTypesSchema,
}

const POST_TYPE_CONFIGS = {
  // ...existing configs
  new_type: NEW_TYPE_CONFIG,
}
```

That's it! No new functions needed.

## Future Enhancements

### Potential Additions
- GraphQL support
- Batch requests
- Webhook integration for real-time invalidation
- Request deduplication
- Response caching layer

### Configuration Options
```typescript
export interface ClientConfig {
  baseUrl: string
  retry: RetryConfig
  rateLimit: {
    maxTokens: number
    refillRate: number
  }
}

export function configureClient(config: Partial<ClientConfig>): void {
  // Update global instances
}
```
