# Use the official Node.js 20 image as the base image
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including devDependencies) for build
RUN npm ci --only=production=false

# Copy the rest of the application code
COPY . .

# Build the Next.js app with explicit error handling
RUN npm run build || (echo "Build failed" && exit 1)

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose the port the app runs on (Cloud Run expects $PORT)
EXPOSE 8080

# Start the Next.js app
CMD ["npm", "run", "start"]
