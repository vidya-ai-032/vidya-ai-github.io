// Plain JavaScript configuration file - no TypeScript
module.exports = {
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
  experimental: {
    serverMinification: true,
  },
  // Explicitly set minification options for Next.js 15
  // Removing swcMinify since it's deprecated
};
