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
    // Next.js 15: swcMinify is enabled by default, no need to configure
  };
}
