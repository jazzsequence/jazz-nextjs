import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Pantheon deployment

  // Pantheon persistent cache handler (production only)
  ...(process.env.NODE_ENV === "production" && {
    cacheHandler: "./cacheHandler.mjs",
    cacheMaxMemorySize: 0, // Disable default in-memory caching
  }),

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
