// This script runs after npm install to patch the Next.js CSS processing
// to avoid using LightningCSS in Docker builds
const fs = require("fs");
const path = require("path");

try {
  // Define the path to the CSS plugins file in Next.js
  const cssPluginsPath = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "build",
    "webpack",
    "config",
    "blocks",
    "css",
    "plugins.js"
  );

  // Check if the file exists
  if (fs.existsSync(cssPluginsPath)) {
    console.log("Patching Next.js CSS plugins to avoid LightningCSS...");

    // Read the file content
    let content = fs.readFileSync(cssPluginsPath, "utf8");

    // Check if the file contains LightningCSS imports
    if (content.includes("lightningcss")) {
      // Replace the LightningCSS usage with a fallback
      content = content.replace(
        /try\s*{\s*const\s+lightningcss\s*=\s*require\s*\(['"]lightningcss['"]\)/g,
        'try { const lightningcss = null; throw new Error("LightningCSS disabled")'
      );

      // Write the modified content back
      fs.writeFileSync(cssPluginsPath, content);
      console.log("Next.js CSS plugins patched successfully.");
    } else {
      console.log("No LightningCSS imports found in the file.");
    }
  } else {
    console.log("CSS plugins file not found. Skipping patch.");
  }
} catch (error) {
  console.error("Error patching Next.js:", error);
}
