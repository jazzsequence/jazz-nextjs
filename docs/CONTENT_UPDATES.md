# Content Update Strategy

This document explains how the Next.js frontend stays in sync with WordPress content changes.

## Overview

Content freshness is handled by two complementary mechanisms:

1. **ISR (Incremental Static Regeneration)** — background revalidation on a timer (1 hour)
2. **On-demand revalidation** — instant revalidation triggered by a WordPress mu-plugin when content is published or updated

## 1. ISR — Incremental Static Regeneration

All routes use `export const revalidate = 3600` (1 hour). After the interval expires, the next request triggers a background rebuild — the user gets the cached page immediately, and subsequent requests get the fresh version.

ISR is the safety net. On-demand revalidation handles the common case of intentional publishes.

**ISR is already fully implemented** across all routes:
- `/` — homepage
- `/posts`, `/posts/[slug]`, `/posts/page/[page]`
- `/[slug]`, `/[slug]/[child]` — WordPress pages
- `/games`
- `/media`, `/media/[slug]`, `/media/page/[page]`
- `/tag/[slug]`, `/category/[slug]`
- `app/sitemap.ts` — `export const revalidate = 3600` (sitemap regenerates hourly)

Cache tags are used for grouped invalidation — e.g., all pages tagged `posts` can be revalidated together when any post is published.

## 2. On-Demand Revalidation

### Next.js Endpoint

`POST /api/revalidate` — implemented at `app/api/revalidate/route.ts`.

**Authentication**: `X-Revalidate-Secret` header must match `REVALIDATE_SECRET` env var (set in Pantheon secrets).

**Payload formats** (both work, can be combined):

```bash
# Explicit path + tag (generic)
curl -X POST https://live-jazz-nextjs15.pantheonsite.io/api/revalidate \
  -H "X-Revalidate-Secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"path": "/posts/my-post", "tag": "posts"}'

# WordPress-native (auto-computes paths and tags from post type)
curl -X POST https://live-jazz-nextjs15.pantheonsite.io/api/revalidate \
  -H "X-Revalidate-Secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"post_type": "post", "post_slug": "my-post"}'

# Multi-tag
curl -X POST https://live-jazz-nextjs15.pantheonsite.io/api/revalidate \
  -H "X-Revalidate-Secret: $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["menu", "header"]}'
```

**post_type → path/tag mapping**:

| post_type | paths revalidated | tags revalidated |
|-----------|-------------------|------------------|
| `post` | `/posts/<slug>` | `posts`, `post-<slug>` |
| `page` | `/<slug>` | `pages`, `page-<slug>` |
| `gc_game` | `/games` | `games`, `game-<slug>` |
| `media` | `/media/<slug>` | `media`, `media-<slug>` |
| other | _(no-op)_ | _(no-op)_ |

**Response**:
```json
{
  "success": true,
  "revalidated": true,
  "paths": ["/posts/my-post"],
  "tags": ["posts", "post-my-post"],
  "timestamp": "2026-03-20T14:00:00.000Z"
}
```

### WordPress Plugin

`scripts/wordpress-revalidation-plugin.php` — installed as a mu-plugin on jazzsequence.com at `wp-content/mu-plugins/headless-revalidation.php`. Activates automatically; no WP admin setup required.

**Hooks**:
- `save_post` — fires on publish/update/trash. Sends `post_type` + `post_slug` to the Next.js endpoint. Skips autosaves, revisions, and non-publish/trash statuses. Strips `__trashed` suffix from slug on trash.
- `wp_update_nav_menu` — fires when menus change. Revalidates `menu` and `header` tags so navigation updates immediately.

**Configuration** (add to `wp-config.php` on jazzsequence.com):
```php
define( 'NEXTJS_SITE_URL', 'https://live-jazz-nextjs15.pantheonsite.io' );
define( 'NEXTJS_REVALIDATE_SECRET', 'same-value-as-REVALIDATE_SECRET-in-pantheon' );
```

Requests are fire-and-forget (`blocking: false`) — the webhook does not slow down post saves.

## Environment Variables

| Location | Variable | Purpose |
|----------|----------|---------|
| Pantheon secrets (Next.js) | `REVALIDATE_SECRET` | Auth token for the revalidate endpoint |
| WordPress `wp-config.php` | `NEXTJS_SITE_URL` | URL of the Next.js site to revalidate |
| WordPress `wp-config.php` | `NEXTJS_REVALIDATE_SECRET` | Must match `REVALIDATE_SECRET` exactly |

## Cache Tags Reference

Tags used across the codebase for grouped invalidation:

| Tag | What it covers |
|-----|----------------|
| `posts` | All post archive pages + homepage |
| `post-<slug>` | Individual post page |
| `pages` | All WordPress page routes |
| `page-<slug>` | Individual page route |
| `games` | Games archive |
| `game-<slug>` | Individual game (not a separate route, but tagged for future use) |
| `media` | Media archive pages (`/media`, `/media/page/[page]`) |
| `media-<slug>` | Individual media item page (`/media/[slug]`) |
| `menu`, `header` | All pages that include navigation |
| `tag-<slug>` | Tag archive page |
| `category-<slug>` | Category archive page |

## Troubleshooting

### Content not updating after publish

1. Check that `NEXTJS_SITE_URL` and `NEXTJS_REVALIDATE_SECRET` are set in WordPress `wp-config.php`
2. Verify the WordPress mu-plugin is loaded: `wp plugin list --status=must-use` (via Terminus)
3. Test the endpoint manually:
   ```bash
   curl -X POST https://live-jazz-nextjs15.pantheonsite.io/api/revalidate \
     -H "X-Revalidate-Secret: $REVALIDATE_SECRET" \
     -H "Content-Type: application/json" \
     -d '{"path": "/posts/your-slug"}'
   ```
4. ISR fallback: content will update within 1 hour regardless

### Endpoint returns 401

Secret mismatch — confirm `NEXTJS_REVALIDATE_SECRET` in wp-config.php equals `REVALIDATE_SECRET` in Pantheon secrets exactly (no trailing spaces).

### Endpoint returns 500

Check Next.js logs: `terminus node:logs:build:list jazz-nextjs15.live`

## Security

- Secret is stored in Pantheon Secrets Manager (write-only, not readable via Terminus)
- Endpoint rejects all requests without valid secret header
- WordPress plugin uses `wp_json_encode` and `wp_remote_post` (safe defaults)
- Plugin is fire-and-forget — no sensitive data returned to WordPress

## Last Updated
2026-03-20
