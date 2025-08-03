const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Disable lightningcss to avoid native module issues
      lightningcss: false,
    },
  },
};

export default config;
