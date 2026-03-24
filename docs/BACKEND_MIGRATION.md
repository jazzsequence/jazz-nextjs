# Backend Migration Guide

How to decouple the WordPress backend from `jazzsequence.com` so this Next.js app becomes the sole occupant of that domain. WordPress moves to a separate URL — a Pantheon platform domain, a custom subdomain, or any other host.

---

## Goal State

```
jazzsequence.com                          → Next.js frontend (Pantheon) — ONLY this
<backend-url>/wp-json/                    → WordPress REST API
<backend-url>/wp-admin/                   → WordPress admin (unchanged)
sfo2.digitaloceanspaces.com/cdn.jazzsequence/ → Media CDN (unchanged, or move later)
```

The backend URL can be anything — e.g.:
- `https://live-jazzsequence-backend.pantheonsite.io` (Pantheon platform domain, simplest)
- `https://cms.jazzsequence.com` (custom subdomain, cleaner but requires DNS)

---

## WordPress URL Configuration

WordPress has two distinct URL settings. This is what makes headless work:

| Setting | Value | Controls |
|---|---|---|
| `WP_SITEURL` | `https://<backend-url>` | wp-admin, wp-json, wp-content paths |
| `WP_HOME` | `https://jazzsequence.com` | where WordPress thinks the public site lives |

When `WP_HOME` ≠ `WP_SITEURL`, WordPress automatically redirects non-admin / non-REST-API frontend requests from the backend URL to `WP_HOME`. So `<backend-url>/some-post/` → 301 → `jazzsequence.com/some-post/`. The REST API and wp-admin are **not** redirected.

Set these in `wp-config.php` (or Pantheon environment variables):

```php
define( 'WP_SITEURL', 'https://live-jazzsequence-backend.pantheonsite.io' );
define( 'WP_HOME',    'https://jazzsequence.com' );
```

### What this means for content

- **Internal post links** in content: generated from `WP_HOME` (`jazzsequence.com`) — already correct
- **Media/image URLs**: generated from `WP_SITEURL` (`<backend-url>/wp-content/uploads/...`) — the Next.js app needs to allow this domain for image optimization (see `next.config.ts` below)
- **CDN images**: WP Offload Media rewrites these to the CDN URL regardless of `WP_SITEURL` — unaffected

---

## What's Already Environment-Variable-Controlled

These are **already configurable** — no code changes needed:

| Variable | Default | Controls |
|---|---|---|
| `WORDPRESS_API_URL` | `https://jazzsequence.com/wp-json/wp/v2` | All WordPress REST API calls |
| `GC_API_URL` | `https://jazzsequence.com/wp-json/gc/v1` | Games Collector API |
| `REVALIDATE_SECRET` | — | On-demand ISR revalidation endpoint |
| `SLACK_WEBHOOK_URL` | — | Deployment Slack notifications |

Set `WORDPRESS_API_URL=https://<backend-url>/wp-json/wp/v2` (and `GC_API_URL` similarly) to point the frontend at the new backend. This is the primary migration lever.

---

## What Needs Code Changes

### 1. `next.config.ts` — image remote patterns

The backend domain must be in `remotePatterns` for `next/image` to serve images from it:

```ts
// next.config.ts — make remotePatterns configurable
const backendHostname = new URL(
  process.env.WORDPRESS_BASE_URL || process.env.WORDPRESS_API_URL || 'https://jazzsequence.com'
).hostname

images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'sfo2.digitaloceanspaces.com',
      pathname: '/cdn.jazzsequence/**',
    },
    {
      protocol: 'https',
      hostname: backendHostname,
      pathname: '/wp-content/uploads/**',
    },
  ]
}
```

This is the one place still hardcoded (`next.config.ts` already reads env vars at build time but the hostname is literal). With this change, rebuilding with `WORDPRESS_BASE_URL=https://<backend-url>` will configure the image optimizer correctly.

### 2. CORS on the WordPress backend

The backend must allow REST API requests from `jazzsequence.com`. Add to the backend's nginx config or via plugin:

```nginx
add_header Access-Control-Allow-Origin "https://jazzsequence.com";
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
add_header Access-Control-Allow-Headers "Authorization, Content-Type";
```

Or use the `wp-cors` plugin configured to allow the frontend origin.

### 3. MCP server — `.mcp.json`

Update the endpoint:

```json
{
  "mcpServers": {
    "jazzsequence-wordpress": {
      "url": "https://<backend-url>/wp-json/mcp/mcp-adapter-default-server"
    }
  }
}
```

---

## Code Already Parameterized (Completed)

The following were already hardcoded but have been updated to derive from `WORDPRESS_BASE_URL` / `WORDPRESS_API_URL`:

- `src/lib/wordpress/greeting.ts` — Accelerate audience endpoint
- `src/lib/url-transform.ts` — Menu URL hostname check
- `src/components/PostContent.tsx` — `rewriteInternalLinks` regexes

These all fall back to `jazzsequence.com` when env vars are absent.

---

## New Environment Variable

Add to `.env.local` for local dev and Pantheon secrets for production:

```bash
# Base URL of the WordPress backend (no trailing slash)
# All other WordPress URLs are derived from this or from WORDPRESS_API_URL
WORDPRESS_BASE_URL=https://live-jazzsequence-backend.pantheonsite.io

# These are already env-var-driven but must be updated:
WORDPRESS_API_URL=https://live-jazzsequence-backend.pantheonsite.io/wp-json/wp/v2
GC_API_URL=https://live-jazzsequence-backend.pantheonsite.io/wp-json/gc/v1
```

`WORDPRESS_BASE_URL` is the single source of truth. `WORDPRESS_API_URL` and `GC_API_URL` can be derived from it but are explicit for clarity.

---

## Social / ActivityPub URLs

`OpenSocialFollow.tsx` and `Footer.tsx` contain personal social links including `@jazzsequence@jazzsequence.com` for ActivityPub federation. These reference the **frontend** domain (`jazzsequence.com`), not the backend, and are intentionally static — they do not change.

---

## Migration Steps

### Pantheon: Move WordPress to a New Site

1. Create a new Pantheon site for the backend (e.g. `jazzsequence-backend`)
2. Clone database and files from the current WordPress install
3. Set `WP_SITEURL` and `WP_HOME` in `wp-config.php` (or Pantheon environment variables)
4. Do **not** run a WP-CLI search-replace for the domain — `WP_HOME` being set to `jazzsequence.com` means internal post links are already correct
5. Verify REST API responds at `https://<backend-url>/wp-json/`
6. Configure CORS

### Update Next.js Frontend

7. Set `WORDPRESS_BASE_URL`, `WORDPRESS_API_URL`, `GC_API_URL` in Pantheon secrets
8. Update `next.config.ts` image remote patterns (see above)
9. Update `.mcp.json` endpoint
10. Rebuild and deploy the Next.js frontend
11. Test all page types: homepage, posts, pages, archives, games
12. Verify images load (CDN and direct wp-content URLs from new backend)
13. Test on-demand revalidation endpoint
14. Test MCP server connectivity

### DNS (if using custom subdomain)

15. Add `cms.jazzsequence.com` CNAME → Pantheon backend environment
16. Add custom domain on the Pantheon backend site
17. Verify HTTPS cert on subdomain
18. `jazzsequence.com` DNS already points at Pantheon Next.js — no change needed

If using a Pantheon platform domain (`*.pantheonsite.io`), skip steps 15–17.

---

*Last updated: 2026-03-24*
