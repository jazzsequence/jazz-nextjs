import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Pantheon deployment

  // Pantheon persistent cache handler (production only, when on Pantheon)
  ...(process.env.NODE_ENV === "production" && process.env.PANTHEON_ENVIRONMENT && {
    cacheHandler: "./cacheHandler.mjs",
    cacheMaxMemorySize: 0, // Disable default in-memory caching
  }),

  // Tell Pantheon GCDN to cache HTML page responses for one year.
  //
  // Surrogate-Control is read by the GCDN for its own TTL decisions and stripped
  // before forwarding to the browser. This works even when Next.js emits
  // Cache-Control: private for dynamically-rendered segments — the GCDN respects
  // Surrogate-Control over Cache-Control for shared-cache caching decisions.
  //
  // TTL is one year (31536000s) — on-demand invalidation via /api/revalidate
  // webhooks handles content freshness; TTL is just the safety-net expiry.
  // High TTL is safe because the GCDN purges by Surrogate-Key on every content
  // change, same as Pantheon Advanced Page Cache does for WordPress sites.
  //
  // Excludes: API routes, Next.js internals, the search page (revalidate=0),
  // and the opengraph-image route (force-dynamic).
  async headers() {
    return [
      // ── CDN cache TTL ───────────────────────────────────────────────────────
      {
        source: "/((?!api|_next|search|opengraph-image).*)",
        headers: [
          {
            key: "Surrogate-Control",
            value: "max-age=31536000",
          },
          {
            key: "Cache-Control",
            value: "s-maxage=31536000, stale-while-revalidate=31536000",
          },
        ],
      },

      // ── Surrogate-Key headers ───────────────────────────────────────────────
      // The GCDN indexes these so targeted purges work when content is published.
      // Path params (e.g. :slug) are interpolated by Next.js into the value.
      // The GCS cache handler's onRevalidateComplete() calls the Pantheon
      // outbound proxy to purge these keys from the GCDN after revalidateTag().
      { source: "/",                           headers: [{ key: "Surrogate-Key", value: "posts home" }] },
      { source: "/page/:page",                 headers: [{ key: "Surrogate-Key", value: "posts home" }] },
      { source: "/posts",                      headers: [{ key: "Surrogate-Key", value: "posts" }] },
      { source: "/posts/page/:page",           headers: [{ key: "Surrogate-Key", value: "posts" }] },
      { source: "/posts/:slug",                headers: [{ key: "Surrogate-Key", value: "post-:slug posts" }] },
      { source: "/media",                      headers: [{ key: "Surrogate-Key", value: "media" }] },
      { source: "/media/page/:page",           headers: [{ key: "Surrogate-Key", value: "media" }] },
      { source: "/media/:slug",                headers: [{ key: "Surrogate-Key", value: "media-:slug media" }] },
      { source: "/games",                      headers: [{ key: "Surrogate-Key", value: "games" }] },
      { source: "/category/:slug",             headers: [{ key: "Surrogate-Key", value: "category-:slug categories" }] },
      { source: "/category/:slug/page/:page",  headers: [{ key: "Surrogate-Key", value: "category-:slug categories" }] },
      { source: "/tag/:slug",                  headers: [{ key: "Surrogate-Key", value: "tag-:slug tags" }] },
      { source: "/tag/:slug/page/:page",       headers: [{ key: "Surrogate-Key", value: "tag-:slug tags" }] },
      { source: "/series/:slug",               headers: [{ key: "Surrogate-Key", value: "series-:slug series" }] },
      { source: "/series/:slug/page/:page",    headers: [{ key: "Surrogate-Key", value: "series-:slug series" }] },
      { source: "/:slug",                      headers: [{ key: "Surrogate-Key", value: "pages" }] },
      { source: "/:slug/:child",               headers: [{ key: "Surrogate-Key", value: "pages" }] },
    ];
  },

  // Image optimization for WordPress media (served via DigitalOcean CDN)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sfo2.digitaloceanspaces.com",
        pathname: "/cdn.jazzsequence/**",
      },
      {
        protocol: "https",
        hostname: "jazzsequence.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
