/**
 * Surrogate-Key proxy — required for Pantheon GCDN (Fastly) cache invalidation.
 *
 * Without this, page responses never emit `Surrogate-Key` headers, so Fastly
 * never indexes which cached responses carry which ISR tags. When `revalidateTag()`
 * fires and the GCS cache handler calls the Pantheon outbound proxy to purge tags,
 * Fastly has no mapping to act on and the purge is a no-op.
 *
 * With this proxy:
 *   1. Each page response carries `Surrogate-Key: posts post-my-slug home ...`
 *   2. Fastly stores tag → response mappings
 *   3. On publish: revalidateTag() → GCS handler → outbound proxy DELETE /keys/{tag}
 *      → Fastly purges all responses carrying that tag
 *
 * `OUTBOUND_PROXY_ENDPOINT` is a Pantheon container-internal sidecar injected
 * automatically at runtime — no credentials needed here.
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
