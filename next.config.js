// Plain JavaScript configuration file - no TypeScript
// Check if we should use Docker-specific config
if (process.env.NEXT_CONFIG_FILE === "next.config.docker.js") {
  // Use Docker config
  module.exports = require("./next.config.docker.js");
} else {
  // Use standard config for Next.js 15
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
    // Enhanced production optimizations
    compiler: {
      // Remove console.log in production builds
      removeConsole: process.env.NODE_ENV === 'production' ? {
        exclude: ['error', 'warn']
      } : false,
    },
    // Production-specific optimizations
    productionBrowserSourceMaps: false,
    compress: true,
    // Better caching for static assets
    assetPrefix: process.env.NODE_ENV === 'production' ? process.env.ASSET_PREFIX : '',
    // Webpack optimizations for production
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      if (!dev && !isServer) {
        // Production client-side optimizations
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            ...config.optimization.splitChunks,
            cacheGroups: {
              ...config.optimization.splitChunks.cacheGroups,
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
            },
          },
        };
      }
      
      return config;
    },
    // Next.js 15: swcMinify is enabled by default, no need to configure
  };
}
