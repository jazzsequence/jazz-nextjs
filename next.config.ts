import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone", // Required for Pantheon deployment

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
