/**
 * Surrogate-Key proxy — required for Pantheon GCDN cache invalidation.
 *
 * Without this, page responses never emit `Surrogate-Key` headers, so the
 * GCDN never indexes which cached responses carry which ISR tags. When
 * `revalidateTag()` fires and the GCS cache handler calls the Pantheon
 * outbound proxy to purge tags, the GCDN has no mapping to act on.
 *
 * With this proxy:
 *   1. Each page response carries `Surrogate-Key: posts post-my-slug home ...`
 *   2. The GCDN stores tag → response mappings
 *   3. On publish: revalidateTag() → GCS handler → outbound proxy DELETE /keys/{tag}
 *      → GCDN purges all responses carrying that tag
 *
 * `OUTBOUND_PROXY_ENDPOINT` is a Pantheon container-internal sidecar injected
 * automatically at runtime — no credentials needed here.
 *
 * Import note: `@pantheon-systems/nextjs-cache-handler` v0.4.0 ships
 * `dist/middleware/` but omits it from the package `exports` field — a bug
 * tracked at https://github.com/pantheon-systems/nextjs-cache-handler/issues/28
 * The postinstall script `scripts/patch-cache-handler.mjs` adds the missing
 * `./middleware` export until the package is updated upstream.
 *
 * Note: `middleware` file convention was deprecated in Next.js 16 in favour of `proxy`.
 */
import { createSurrogateKeyMiddleware } from '@pantheon-systems/nextjs-cache-handler/middleware'

// Next.js 16 requires the exported function to be named `proxy` (not `middleware`)
export const proxy = createSurrogateKeyMiddleware()

export const config = {
  matcher: [
    /*
     * Run on all paths EXCEPT static assets and the OG image route.
     * api routes are included so the revalidate webhook still works.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|opengraph-image).*)',
  ],
}
