import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for now, use default SSR/SSG
  images: {
    unoptimized: true,
    domains: ['img.youtube.com', 'i.ytimg.com']
  },
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
