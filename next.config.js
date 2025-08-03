// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  // Ensure TypeScript is handled properly
  typescript: {
    // During production builds, Next.js will error if there are TypeScript errors
    ignoreBuildErrors: false,
  },
  // Ensure ESLint is handled properly
  eslint: {
    // During production builds, Next.js will error if there are ESLint errors
    ignoreDuringBuilds: false,
  },
  // Output configuration for production
  output: "standalone",
  /* config options here */
};

module.exports = nextConfig;
