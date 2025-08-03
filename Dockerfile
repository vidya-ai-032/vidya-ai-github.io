# Use the official Node.js 18 image as the base image
FROM node:18-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Next.js app
RUN npm run build

# Remove devDependencies for a smaller image
RUN npm prune --production

# Expose the port the app runs on (Cloud Run expects $PORT)
EXPOSE 8080

# Start the Next.js app
CMD ["npm", "run", "start"]
