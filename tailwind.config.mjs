export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
  // Disable lightningcss to avoid native module issues in Docker builds
  lightningcss: false,
  // Explicitly use PostCSS for nesting instead of LightningCSS
  future: {
    useNativeNesting: false,
  },
};
