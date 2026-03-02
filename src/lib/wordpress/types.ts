/**
 * WordPress REST API TypeScript type definitions
 * Based on WordPress REST API v2 response structure
 */

// Common WordPress types
export interface WPRendered {
  rendered: string
  protected?: boolean
}

export interface WPAvatar {
  '24'?: string
  '48'?: string
  '96'?: string
}

export interface WPAuthor {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
  avatar_urls: WPAvatar
}

export interface WPFeaturedMedia {
  id: number
  source_url: string
  alt_text: string
  media_details?: {
    width: number
    height: number
    sizes?: Record<string, {
      source_url: string
      width: number
      height: number
    }>
  }
}

export interface WPTerm {
  id: number
  name: string
  slug: string
  taxonomy: string
  link?: string
  description?: string
  count?: number
}

export interface WPEmbedded {
  author?: WPAuthor[]
  'wp:featuredmedia'?: WPFeaturedMedia[]
  'wp:term'?: WPTerm[][]
}

// Base WordPress content type
export interface WPBaseContent {
  id: number
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  slug: string
  status: 'publish' | 'draft' | 'pending' | 'private' | 'future'
  type: string
  link: string
  title: WPRendered
  content: WPRendered
  excerpt: WPRendered
  author: number
  featured_media: number
  comment_status: 'open' | 'closed'
  ping_status: 'open' | 'closed'
  template: string
  meta: Record<string, unknown>
  _embedded?: WPEmbedded
}

// Posts
export interface WPPost extends WPBaseContent {
  type: 'post'
  sticky: boolean
  format: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio'
  categories: number[]
  tags: number[]
}

// Pages
export interface WPPage extends WPBaseContent {
  type: 'page'
  parent: number
  menu_order: number
}

// Games (gc_game)
export interface WPGame extends WPBaseContent {
  type: 'gc_game'
  gc_attribute: number[] // Game attributes taxonomy
  meta: {
    gc_min_players?: number
    gc_max_players?: number
    gc_playing_time?: number
    gc_age?: number
    gc_difficulty?: string
    gc_more_info?: string
  }
}

// Recipes (rb_recipe)
export interface WPRecipe extends WPBaseContent {
  type: 'rb_recipe'
  rb_recipe_category: number[]
  rb_meal_type: number[]
  rb_recipe_cuisine: number[]
  meta: {
    rb_ingredients?: string[] | WPIngredient[]
    rb_instructions?: string
    rb_prep_time?: string
    rb_cook_time?: string
    rb_servings?: number
    rb_notes?: string
  }
}

export interface WPIngredient {
  id: number
  title: WPRendered
  content?: WPRendered
}

// Media (jazzsequence media)
export interface WPMedia extends WPBaseContent {
  type: 'media'
  meta: {
    media_url?: string // YouTube or WordPress.tv URL
    media_source?: 'youtube' | 'wordpresstv'
  }
}

// Artists (plague-artist)
export interface WPArtist extends WPBaseContent {
  type: 'plague-artist'
  meta: {
    artist_website?: string
    artist_facebook?: string
    artist_twitter?: string
    artist_myspace?: string
    artist_reverbnation?: string
    artist_soundcloud?: string
    artist_bandcamp?: string
    artist_alonetone?: string
    artist_rpm?: string
    artist_press?: string
  }
}

// Movies (gc_movie or movie)
export interface WPMovie extends WPBaseContent {
  type: 'movie'
  genre: number[]
  actor: number[]
  collection: number[]
  meta: Record<string, unknown> // Movie metadata varies
}

// Addresses (ab_address)
export interface WPAddress extends WPBaseContent {
  type: 'ab_address'
  ab_family: number[] // Family taxonomy
  relationship: number[] // Relationship taxonomy
  meta: {
    ab_email?: string
    ab_phone?: string
    ab_address_line1?: string
    ab_address_line2?: string
    ab_city?: string
    ab_state?: string
    ab_zip?: string
    ab_country?: string
  }
}

// Category
export interface WPCategory {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: 'category'
  parent: number
  meta: Record<string, unknown>
}

// Tag
export interface WPTag {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: 'post_tag'
  meta: Record<string, unknown>
}

// Series (from Organize Series plugin)
export interface WPSeries {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: 'series'
  meta: Record<string, unknown>
}

// Menu
export interface WPMenu {
  id: number
  name: string
  slug: string
  description: string
  count?: number | null
  meta: Record<string, unknown> | unknown[]
  locations: string[]
  auto_add?: boolean
  _links?: Record<string, unknown>
}

// Menu Item
export interface WPMenuItem {
  id: number
  title: WPRendered
  url: string
  attr_title: string
  description: string
  type: string
  type_label: string
  object: string
  object_id: number
  parent: number
  menu_order: number
  target: string
  classes: string[]
  xfn: string[]
  invalid: boolean
  meta: Record<string, unknown>
  menus: number
  _links?: {
    self?: Array<{ href: string }>
    collection?: Array<{ href: string }>
  }
}

// API Response wrapper types
export type WPAPIListResponse<T> = T[]

export interface WPAPIError {
  code: string
  message: string
  data: {
    status: number
  }
}

// Union type for all content types
export type WPContent =
  | WPPost
  | WPPage
  | WPGame
  | WPRecipe
  | WPMedia
  | WPArtist
  | WPMovie
  | WPAddress

// Taxonomy union type
export type WPTaxonomy =
  | WPCategory
  | WPTag
  | WPSeries
  | WPTerm
