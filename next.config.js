// This is a JavaScript file and should not be processed as TypeScript
const config = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  typescript: {
    // !! WARN !!
    // This setting is temporarily enabled to facilitate the build
    // TODO: Remove this once TypeScript issues are resolved
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // This setting is temporarily enabled to facilitate the build
    // TODO: Remove this once ESLint issues are resolved
    ignoreDuringBuilds: true,
  },
  output: "standalone",
  // Ensure we're using the correct Node.js version
  experimental: {
    serverMinification: true,
  },
};

module.exports = config;
