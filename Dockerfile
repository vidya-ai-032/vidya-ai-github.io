# Use the official Node.js 20 image as the base image
FROM node:20.19.4-slim AS runner

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
ENV NODE_ENV=production
RUN npm ci --only=production

# Copy built application
COPY . .

# Set the environment to production
ENV NODE_ENV production
ENV PORT 8080
ENV NEXT_TELEMETRY_DISABLED 1

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["npm", "start"]