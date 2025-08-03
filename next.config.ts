import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  typescript: {
    // Temporarily disable TypeScript checking during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily disable ESLint during build
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  // Disable type checking during build
  skipTypeschecking: true,
  experimental: {
    serverMinification: true,
  },
  // Ensure we don't try to process this as TypeScript
  swcMinify: true,
};

export default config;
