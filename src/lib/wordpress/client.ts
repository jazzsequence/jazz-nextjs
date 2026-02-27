import type {
  WPPost,
  WPPage,
  WPGame,
  WPRecipe,
  WPArtist,
  WPAPIListResponse,
} from './types'

const API_BASE_URL =
  process.env.WORDPRESS_API_URL || 'https://jazzsequence.com/wp-json/wp/v2'

export interface FetchOptions {
  page?: number
  perPage?: number
  embed?: boolean
  search?: string
  categories?: number[]
  tags?: number[]
  orderBy?: 'date' | 'title' | 'modified'
  order?: 'asc' | 'desc'
}

/**
 * Build query parameters from options
 */
function buildQueryParams(options: FetchOptions = {}): string {
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
 * Generic fetch function with error handling for lists
 */
async function fetchFromAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const queryParams = buildQueryParams(options)
  const url = `${API_BASE_URL}/${endpoint}${queryParams}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to fetch ${endpoint}`)
  }
}

/**
 * Generic function to fetch a single item by slug (DRY)
 */
async function fetchBySlug<T>(
  endpoint: string,
  slug: string,
  typeName: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}?slug=${slug}${buildQueryParams(options)}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${typeName}: ${slug}`)
    }

    const data = await response.json()
    if (!data.length) {
      throw new Error(`${typeName} not found: ${slug}`)
    }

    return data[0] as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`Failed to fetch ${typeName}: ${slug}`)
  }
}

// ===== Posts =====

export async function fetchPosts(
  options: FetchOptions = {}
): Promise<WPAPIListResponse<WPPost>> {
  return fetchFromAPI<WPAPIListResponse<WPPost>>('posts', options)
}

export async function fetchPost(
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<WPPost> {
  return fetchBySlug<WPPost>('posts', slug, 'Post', options)
}

// ===== Pages =====

export async function fetchPages(
  options: FetchOptions = {}
): Promise<WPAPIListResponse<WPPage>> {
  return fetchFromAPI<WPAPIListResponse<WPPage>>('pages', options)
}

export async function fetchPage(
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<WPPage> {
  return fetchBySlug<WPPage>('pages', slug, 'Page', options)
}

// ===== Games (gc_game) =====

export async function fetchGames(
  options: FetchOptions = {}
): Promise<WPAPIListResponse<WPGame>> {
  return fetchFromAPI<WPAPIListResponse<WPGame>>('gc_game', options)
}

export async function fetchGame(
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<WPGame> {
  return fetchBySlug<WPGame>('gc_game', slug, 'Game', options)
}

// ===== Recipes (rb_recipe) =====

export async function fetchRecipes(
  options: FetchOptions = {}
): Promise<WPAPIListResponse<WPRecipe>> {
  return fetchFromAPI<WPAPIListResponse<WPRecipe>>('rb_recipe', options)
}

export async function fetchRecipe(
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<WPRecipe> {
  return fetchBySlug<WPRecipe>('rb_recipe', slug, 'Recipe', options)
}

// ===== Artists (plague-artist) =====

export async function fetchArtists(
  options: FetchOptions = {}
): Promise<WPAPIListResponse<WPArtist>> {
  return fetchFromAPI<WPAPIListResponse<WPArtist>>('plague-artist', options)
}

export async function fetchArtist(
  slug: string,
  options: Omit<FetchOptions, 'search'> = {}
): Promise<WPArtist> {
  return fetchBySlug<WPArtist>('plague-artist', slug, 'Artist', options)
}
