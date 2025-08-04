export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
  // Disable lightningcss to avoid native module issues in Docker builds
  lightningcss: false,
  // Explicitly use PostCSS for nesting instead of LightningCSS
  future: {
    useNativeNesting: false,
  },
};
