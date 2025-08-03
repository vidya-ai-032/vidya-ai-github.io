// index.js - Main entry point for the Express server

// 1. Import dependencies
const express = require("express");
const path = require("path");

// 2. Create Express app
const app = express();

// 3. Configure middleware
//    Serve static files from the "public" folder (optional)
app.use(express.static(path.join(__dirname, "public")));

//    Parse JSON bodies (for POST requests, if needed)
app.use(express.json());

// 4. Define routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Example API route
app.get("/api/status", (req, res) => {
  res.json({ status: "OK", timestamp: Date.now() });
});

// 5. Read port from environment or default to 8080
const PORT = process.env.PORT || 8080;

// 6. Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
