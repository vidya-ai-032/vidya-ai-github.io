/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  // Temporarily ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Temporarily ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Output configuration for production
  output: "standalone",
};

module.exports = nextConfig;
