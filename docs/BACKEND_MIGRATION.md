# Backend Migration Guide

How to move the WordPress backend to a different host (e.g. a Pantheon-hosted environment) while keeping this Next.js frontend as the canonical `jazzsequence.com`.

---

## Current Architecture

```
jazzsequence.com           → Next.js frontend (Pantheon)
jazzsequence.com/wp-json/  → WordPress REST API (same domain, proxied)
sfo2.digitaloceanspaces.com/cdn.jazzsequence/ → Media CDN (DigitalOcean Spaces)
```

The frontend fetches content from the WordPress REST API at `jazzsequence.com/wp-json/wp/v2`.
When the Next.js app becomes the canonical domain, WordPress moves to a subdomain or a separate Pantheon environment — e.g. `api.jazzsequence.com` or `cms.jazzsequence.com`.

---

## What's Already Environment-Variable-Controlled

These are **already configurable** via `.env.local` / Pantheon environment variables:

| Variable | Default | Controls |
|---|---|---|
| `WORDPRESS_API_URL` | `https://jazzsequence.com/wp-json/wp/v2` | All WordPress REST API calls in `client.ts` and `greeting.ts` |
| `GC_API_URL` | `https://jazzsequence.com/wp-json/gc/v1` | Games Collector API (`client.ts`) |
| `REVALIDATE_SECRET` | — | On-demand ISR revalidation endpoint |
| `SLACK_WEBHOOK_URL` | — | Deployment Slack notifications |

Setting `WORDPRESS_API_URL=https://cms.jazzsequence.com/wp-json/wp/v2` (or your new host) is the main migration lever and covers the majority of content fetching.

---

## What's Still Hardcoded (Needs Code Changes)

### 1. Accelerate audience endpoint — `src/lib/wordpress/greeting.ts`

```ts
fetch('https://jazzsequence.com/wp-json/accelerate/v1/audiences', ...)
```

**Fix**: Extract to an env var. Add to `.env.local` and Pantheon secrets:

```
WORDPRESS_BASE_URL=https://jazzsequence.com
```

Then in `greeting.ts`:
```ts
const baseUrl = process.env.WORDPRESS_BASE_URL || 'https://jazzsequence.com'
fetch(`${baseUrl}/wp-json/accelerate/v1/audiences`, ...)
```

### 2. Internal link rewriting regex — `src/components/PostContent.tsx`

`rewriteInternalLinks()` contains the domain in a regex literal:

```ts
.replace(/https?:\/\/jazzsequence\.com\/(?!wp-content\/)/g, '/')
.replace(/https?:\/\/jazzsequence\.com"/g, '/"')
```

When WordPress is on a separate domain, the content it returns will contain links to the **old** domain (`cms.jazzsequence.com`), not the frontend domain. The rewrites need to target the backend domain and convert to the frontend domain.

**Fix**: Read `WORDPRESS_BASE_URL` at runtime:

```ts
function rewriteInternalLinks(html: string, backendOrigin: string): string {
  const escaped = backendOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return html
    .replace(new RegExp(`(https?://${escaped}/wp-content/uploads)/\/`, 'g'), '$1/')
    .replace(new RegExp(`https?://${escaped}/(?!wp-content/)`, 'g'), '/')
    .replace(new RegExp(`https?://${escaped}"`, 'g'), '/"')
}
```

### 3. Internal link detection — `src/lib/url-transform.ts`

```ts
if (parsedUrl.hostname === 'jazzsequence.com') { ... }
```

**Fix**: Same `WORDPRESS_BASE_URL` env var:

```ts
const backendHostname = new URL(process.env.WORDPRESS_BASE_URL || 'https://jazzsequence.com').hostname
if (parsedUrl.hostname === backendHostname) { ... }
```

### 4. Next.js image remote patterns — `next.config.ts`

```ts
images: {
  remotePatterns: [
    { hostname: 'sfo2.digitaloceanspaces.com', pathname: '/cdn.jazzsequence/**' },
    { hostname: 'jazzsequence.com', pathname: '/wp-content/uploads/**' },
  ]
}
```

`next.config.ts` runs at build time and doesn't support `process.env` for array entries out of the box, but you can compute the patterns dynamically:

```ts
const backendHostname = new URL(process.env.WORDPRESS_BASE_URL || 'https://jazzsequence.com').hostname
const cdnUrl = process.env.MEDIA_CDN_URL || 'https://sfo2.digitaloceanspaces.com'
const cdnPath = process.env.MEDIA_CDN_PATH || '/cdn.jazzsequence/**'

images: {
  remotePatterns: [
    { protocol: 'https', hostname: new URL(cdnUrl).hostname, pathname: cdnPath },
    { protocol: 'https', hostname: backendHostname, pathname: '/wp-content/uploads/**' },
  ]
}
```

### 5. Social/ActivityPub profile URLs — `src/components/OpenSocialFollow.tsx`, `src/components/Footer.tsx`

These are personal social links and are **intentionally static** — they should remain as-is since they reference `@jazzsequence.com` for ActivityPub federation. If the domain changes entirely (not just the backend), these need manual updates.

---

## New Environment Variables Needed

Add these to `.env.local` for local dev and Pantheon secrets for production:

```bash
# Base URL of the WordPress backend (without trailing slash)
WORDPRESS_BASE_URL=https://jazzsequence.com

# If media CDN changes, override these
MEDIA_CDN_URL=https://sfo2.digitaloceanspaces.com
MEDIA_CDN_PATH=/cdn.jazzsequence/**
```

`WORDPRESS_API_URL` and `GC_API_URL` already exist and are the primary levers.

---

## WordPress Side: What Needs to Change

When moving WordPress to a new host:

1. **Domain in WordPress settings**: Update `siteurl` and `home` in wp-options to the new backend URL (e.g. `https://cms.jazzsequence.com`). Do NOT set these to the frontend domain — WordPress permalinks must resolve to the API host.

2. **Search-replace in database**: Run a WP-CLI safe search-replace to update internal content URLs from `https://jazzsequence.com` → `https://cms.jazzsequence.com`. Use `wp search-replace` with the `--dry-run` flag first.

3. **WP Offload Media**: Update the CDN configuration if the bucket changes. Verify the plugin rewrites media URLs in the REST API response correctly.

4. **CORS headers**: WordPress must allow requests from the Next.js frontend domain (`jazzsequence.com`). Add to the new host's nginx or PHP configuration, or use the `wp-cors` plugin.

5. **REST API authentication**: If any future authenticated endpoints are added, `cookie` auth won't work cross-domain — you'll need Application Passwords or JWT tokens.

6. **MCP server**: Update `.mcp.json` endpoint URL from `jazzsequence.com/wp-json/mcp/...` to the new backend URL.

---

## Migration Checklist

- [ ] Spin up WordPress on new host (Pantheon: add new site, import database and files)
- [ ] Update `siteurl` and `home` to new backend URL
- [ ] Run `wp search-replace` for internal content URLs
- [ ] Verify REST API accessible at new host
- [ ] Set `WORDPRESS_BASE_URL`, `WORDPRESS_API_URL`, `GC_API_URL` in Next.js env
- [ ] Fix `greeting.ts` hardcoded URL (see above)
- [ ] Fix `rewriteInternalLinks` regex (see above)
- [ ] Fix `url-transform.ts` hostname check (see above)
- [ ] Update `next.config.ts` image remote patterns (see above)
- [ ] Configure CORS on new WordPress host
- [ ] Update `.mcp.json` with new endpoint
- [ ] Test all page types: homepage, posts, pages, archives, games
- [ ] Verify images load (CDN, and any wp-content direct URLs)
- [ ] Test on-demand revalidation endpoint
- [ ] Update Pantheon redirect rules so `jazzsequence.com/wp-admin` → new host (optional)
- [ ] DNS: point `jazzsequence.com` at Pantheon Next.js, add `cms.jazzsequence.com` CNAME

---

## Recommended Code Changes to Make Migration Easier

These changes can be made now (before any migration) to reduce the migration blast radius:

1. **Add `WORDPRESS_BASE_URL` env var** to `greeting.ts` — the accelerate endpoint is the only remaining hardcoded URL that doesn't use `WORDPRESS_API_URL`

2. **Parameterize `rewriteInternalLinks`** to accept the backend origin from an env var rather than having `jazzsequence\.com` in the regex

3. **Parameterize `url-transform.ts`** hostname check

These three changes don't affect production behavior at all (since the env var falls back to the current value) but make migration a config change rather than a code change.

---

*Last updated: 2026-03-24*
