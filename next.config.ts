import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Pantheon deployment

  // Pantheon persistent cache handler (production only, when on Pantheon)
  ...(process.env.NODE_ENV === "production" && process.env.PANTHEON_ENVIRONMENT && {
    cacheHandler: "./cacheHandler.mjs",
    cacheMaxMemorySize: 0, // Disable default in-memory caching
  }),

  // Tell Pantheon GCDN (Fastly) to cache HTML page responses for one week.
  //
  // Fastly uses Surrogate-Control for its own TTL decisions and strips the header
  // before forwarding to the browser. This works even when Next.js also emits
  // Cache-Control: private for dynamically-rendered segments — Fastly respects
  // Surrogate-Control over Cache-Control for shared-cache caching decisions.
  //
  // TTL is one year (31536000s) — on-demand invalidation via /api/revalidate
  // webhooks handles content freshness; TTL is just the safety-net expiry.
  // High TTL is safe because Fastly purges by Surrogate-Key on every content
  // change, same as Pantheon Advanced Page Cache does for WordPress sites.
  //
  // Excludes: API routes, Next.js internals, the search page (revalidate=0),
  // and the opengraph-image route (force-dynamic).
  async headers() {
    return [
      {
        source: "/((?!api|_next|search|opengraph-image).*)",
        headers: [
          {
            key: "Surrogate-Control",
            value: "max-age=31536000",
          },
          {
            // Next.js skips assigning no-store when Cache-Control is already
            // present (checked in app-page.js before rendering). This catches
            // any route that remains dynamic after generateStaticParams is added.
            key: "Cache-Control",
            value: "s-maxage=31536000, stale-while-revalidate=31536000",
          },
        ],
      },
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
