/**
 * Zod validation schemas for WordPress REST API responses
 * Provides runtime type validation and type inference
 */

import { z } from 'zod'

// Common schemas
export const WPRenderedSchema = z.object({
  rendered: z.string(),
  protected: z.boolean().optional(),
}).passthrough() // Allow extra fields from WordPress plugins

export const WPAvatarSchema = z.object({
  '24': z.string().optional(),
  '48': z.string().optional(),
  '96': z.string().optional(),
}).passthrough() // Allow extra avatar sizes from plugins

export const WPAuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  description: z.string(),
  link: z.string(),
  slug: z.string(),
  avatar_urls: WPAvatarSchema,
}).passthrough() // Allow extra author fields from plugins

export const WPFeaturedMediaSchema = z.object({
  id: z.number(),
  source_url: z.string(),
  alt_text: z.string(),
  media_details: z.object({
    width: z.coerce.number().nullable(), // Coerce strings to numbers (WordPress inconsistency)
    height: z.coerce.number().nullable(), // Coerce strings to numbers (WordPress inconsistency)
    sizes: z.record(z.object({
      source_url: z.string(),
      width: z.coerce.number(), // Coerce strings to numbers (WordPress inconsistency)
      height: z.coerce.number(), // Coerce strings to numbers (WordPress inconsistency)
    }).passthrough()).optional(), // Allow extra size properties
  }).passthrough().optional(), // Allow extra media_details fields
}).passthrough() // Allow extra media fields from plugins

export const WPTermSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.string(),
  link: z.string().optional(),
  description: z.string().optional(),
  count: z.number().optional(),
}).passthrough() // Allow extra term fields from plugins

export const WPEmbeddedSchema = z.object({
  author: z.array(WPAuthorSchema).optional(),
  'wp:featuredmedia': z.array(WPFeaturedMediaSchema).optional(),
  'wp:term': z.array(z.array(WPTermSchema)).optional(),
}).passthrough().optional() // Allow extra _embedded fields from plugins

// Base content schema
export const WPBaseContentSchema = z.object({
  id: z.number(),
  date: z.string(),
  date_gmt: z.string(),
  modified: z.string(),
  modified_gmt: z.string(),
  slug: z.string(),
  status: z.enum(['publish', 'draft', 'pending', 'private', 'future']),
  type: z.string(),
  link: z.string(),
  title: WPRenderedSchema,
  content: WPRenderedSchema,
  excerpt: WPRenderedSchema,
  author: z.number(),
  featured_media: z.number(),
  comment_status: z.enum(['open', 'closed']),
  ping_status: z.enum(['open', 'closed']),
  template: z.string(),
  // WordPress sometimes returns meta as empty array instead of object
  meta: z.union([z.record(z.unknown()), z.array(z.unknown())]).transform(val =>
    Array.isArray(val) ? {} as Record<string, unknown> : val
  ) as unknown as z.ZodType<Record<string, unknown>>,
  _embedded: WPEmbeddedSchema,
}).passthrough() // Allow extra base fields from WordPress plugins

// Post schema
export const WPPostSchema = WPBaseContentSchema.extend({
  type: z.literal('post'),
  sticky: z.boolean(),
  format: z.enum(['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio']),
  categories: z.array(z.number()),
  tags: z.array(z.number()),
}).passthrough() // Allow unknown fields from WordPress plugins

// Page schema
export const WPPageSchema = WPBaseContentSchema.extend({
  type: z.literal('page'),
  parent: z.number(),
  menu_order: z.number(),
}).passthrough() // Allow unknown fields from WordPress plugins

// Game schema
export const WPGameSchema = WPBaseContentSchema.extend({
  type: z.literal('gc_game'),
  gc_attribute: z.array(z.number()),
  meta: z.object({
    gc_min_players: z.number().optional(),
    gc_max_players: z.number().optional(),
    gc_playing_time: z.number().optional(),
    gc_age: z.number().optional(),
    gc_difficulty: z.string().optional(),
    gc_more_info: z.string().optional(),
  }).passthrough(), // Allow extra meta fields from plugins
}).passthrough() // Allow unknown fields from WordPress plugins

// Recipe schema
export const WPIngredientSchema = z.object({
  id: z.number(),
  title: WPRenderedSchema,
  content: WPRenderedSchema.optional(),
})

export const WPRecipeSchema = WPBaseContentSchema.extend({
  type: z.literal('rb_recipe'),
  rb_recipe_category: z.array(z.number()),
  rb_meal_type: z.array(z.number()),
  rb_recipe_cuisine: z.array(z.number()),
  meta: z.object({
    rb_ingredients: z.union([z.array(z.string()), z.array(WPIngredientSchema)]).optional(),
    rb_instructions: z.string().optional(),
    rb_prep_time: z.string().optional(),
    rb_cook_time: z.string().optional(),
    rb_servings: z.number().optional(),
    rb_notes: z.string().optional(),
  }).passthrough(), // Allow extra meta fields from plugins
}).passthrough() // Allow unknown fields from WordPress plugins

// Media schema
export const WPMediaSchema = WPBaseContentSchema.extend({
  type: z.literal('media'),
  meta: z.object({
    media_url: z.string().optional(),
    media_source: z.enum(['youtube', 'wordpresstv']).optional(),
  }).passthrough(), // Allow extra meta fields from plugins
}).passthrough() // Allow unknown fields from WordPress plugins

// Artist schema
export const WPArtistSchema = WPBaseContentSchema.extend({
  type: z.literal('plague-artist'),
  meta: z.object({
    artist_website: z.string().optional(),
    artist_facebook: z.string().optional(),
    artist_twitter: z.string().optional(),
    artist_myspace: z.string().optional(),
    artist_reverbnation: z.string().optional(),
    artist_soundcloud: z.string().optional(),
    artist_bandcamp: z.string().optional(),
    artist_alonetone: z.string().optional(),
    artist_rpm: z.string().optional(),
    artist_press: z.string().optional(),
  }).passthrough(), // Allow extra meta fields from plugins
}).passthrough() // Allow unknown fields from WordPress plugins

// Movie schema
export const WPMovieSchema = WPBaseContentSchema.extend({
  type: z.literal('movie'),
  genre: z.array(z.number()),
  actor: z.array(z.number()),
  collection: z.array(z.number()),
  meta: z.record(z.any()),
}).passthrough() // Allow unknown fields from WordPress plugins

// Address schema
export const WPAddressSchema = WPBaseContentSchema.extend({
  type: z.literal('ab_address'),
  ab_family: z.array(z.number()),
  relationship: z.array(z.number()),
  meta: z.object({
    ab_email: z.string().optional(),
    ab_phone: z.string().optional(),
    ab_address_line1: z.string().optional(),
    ab_address_line2: z.string().optional(),
    ab_city: z.string().optional(),
    ab_state: z.string().optional(),
    ab_zip: z.string().optional(),
    ab_country: z.string().optional(),
  }).passthrough(), // Allow extra meta fields from plugins
}).passthrough() // Allow unknown fields from WordPress plugins

// Category schema — meta is [] for terms with no metadata; passthrough for _links etc.
export const WPCategorySchema = z.object({
  id: z.number(),
  count: z.number(),
  description: z.string(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.literal('category'),
  parent: z.number(),
  meta: z.union([z.record(z.any()), z.array(z.any())]),
}).passthrough()

// Tag schema — meta is [] (empty array) for terms with no metadata; accept both
export const WPTagSchema = z.object({
  id: z.number(),
  count: z.number(),
  description: z.string(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.literal('post_tag'),
  meta: z.union([z.record(z.any()), z.array(z.any())]),
}).passthrough()

// Series schema
export const WPSeriesSchema = z.object({
  id: z.number(),
  count: z.number(),
  description: z.string(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.literal('series'),
  meta: z.record(z.any()),
})

// API error schema
export const WPAPIErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.object({
    status: z.number(),
  }),
})

// Games Collector custom endpoint schema (GET /wp-json/gc/v1/games)
// This is a flat, purpose-built response — not the standard WP REST shape.
export const GCFeaturedImageSchema = z.object({
  id: z.number(),
  url: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  alt: z.string(),
}).nullable()

export const GCGameSchema = z.object({
  id: z.number(),
  slug: z.string(),
  date: z.string(),
  title: WPRenderedSchema,
  min_players: z.number().nullable(),
  max_players: z.number().nullable(),
  time: z.string().nullable(),
  age: z.number().nullable(),
  difficulty: z.string().nullable(),
  url: z.string().nullable(),
  bgg_id: z.number().nullable(),
  attributes: z.array(z.string()),
  attribute_slugs: z.array(z.string()),
  featured_image: GCFeaturedImageSchema,
})

export const GCGamesSchema = z.array(GCGameSchema)

// Array response schemas
export const WPPostsSchema = z.array(WPPostSchema)
export const WPPagesSchema = z.array(WPPageSchema)
export const WPGamesSchema = z.array(WPGameSchema)
export const WPRecipesSchema = z.array(WPRecipeSchema)
export const WPMediaItemsSchema = z.array(WPMediaSchema)
export const WPArtistsSchema = z.array(WPArtistSchema)
export const WPMoviesSchema = z.array(WPMovieSchema)
export const WPAddressesSchema = z.array(WPAddressSchema)
export const WPCategoriesSchema = z.array(WPCategorySchema)
export const WPTagsSchema = z.array(WPTagSchema)
export const WPSeriesListSchema = z.array(WPSeriesSchema)

// Menu schemas
export const WPMenuSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  count: z.number().nullable().optional(),
  meta: z.union([z.record(z.unknown()), z.array(z.unknown())]),
  locations: z.array(z.string()),
  auto_add: z.boolean().optional(),
  _links: z.record(z.unknown()).optional(),
})

export const WPMenusSchema = z.array(WPMenuSchema)

export const WPMenuItemSchema = z.object({
  id: z.number(),
  title: WPRenderedSchema,
  url: z.string(),
  attr_title: z.string(),
  description: z.string(),
  type: z.string(),
  type_label: z.string(),
  object: z.string(),
  object_id: z.number(),
  parent: z.number(),
  menu_order: z.number(),
  target: z.string(),
  classes: z.array(z.string()),
  xfn: z.array(z.string()),
  invalid: z.boolean(),
  meta: z.record(z.unknown()),
  menus: z.number(),
  _links: z.object({
    self: z.array(z.object({ href: z.string() })).optional(),
    collection: z.array(z.object({ href: z.string() })).optional(),
  }).optional(),
})

export const WPMenuItemsSchema = z.array(WPMenuItemSchema)

// Union content schema
export const WPContentSchema = z.union([
  WPPostSchema,
  WPPageSchema,
  WPGameSchema,
  WPRecipeSchema,
  WPMediaSchema,
  WPArtistSchema,
  WPMovieSchema,
  WPAddressSchema,
])

// Type inference helpers
export type InferredWPPost = z.infer<typeof WPPostSchema>
export type InferredWPPage = z.infer<typeof WPPageSchema>
export type InferredWPGame = z.infer<typeof WPGameSchema>
export type InferredWPRecipe = z.infer<typeof WPRecipeSchema>
export type InferredWPMedia = z.infer<typeof WPMediaSchema>
export type InferredWPArtist = z.infer<typeof WPArtistSchema>
export type InferredWPMovie = z.infer<typeof WPMovieSchema>
export type InferredWPAddress = z.infer<typeof WPAddressSchema>
export type InferredWPCategory = z.infer<typeof WPCategorySchema>
export type InferredWPTag = z.infer<typeof WPTagSchema>
export type InferredWPSeries = z.infer<typeof WPSeriesSchema>
export type InferredWPMenu = z.infer<typeof WPMenuSchema>
export type InferredWPMenuItem = z.infer<typeof WPMenuItemSchema>
