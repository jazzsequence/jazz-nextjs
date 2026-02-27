import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Pantheon deployment

  // Pantheon persistent cache handler (released Feb 2026)
  cacheHandler: "./cacheHandler.mjs",
  cacheMaxMemorySize: 0, // Disable default in-memory caching

  // Image optimization for WordPress media (served via DigitalOcean CDN)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sfo2.digitaloceanspaces.com",
        pathname: "/cdn.jazzsequence/**",
      },
    ],
  },
};

export default nextConfig;
