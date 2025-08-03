const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Disable lightningcss to avoid native module issues in Docker builds
      lightningcss: false,
      // Force use of postcss-nested instead of lightningcss
      useNesting: true,
    },
  },
};

export default config;
