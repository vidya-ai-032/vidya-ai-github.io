// Docker-specific Next.js configuration
module.exports = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  typescript: {
    // Disable TypeScript checking during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  experimental: {
    serverMinification: true,
  },
  // Next.js 15: swcMinify is enabled by default
  // Force use of WASM version for lightningcss in Docker builds
  webpack: (config, { webpack }) => {
    // Add an alias for lightningcss to use the WASM version
    config.resolve.alias = {
      ...config.resolve.alias,
      lightningcss: "lightningcss/pkg",
    };
    return config;
  },
};
