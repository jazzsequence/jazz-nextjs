import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Pantheon deployment

  // Image optimization for WordPress media
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jazzsequence.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
