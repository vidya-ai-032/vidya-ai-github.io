# Use the official Node.js 20 image as the base image
FROM node:20.19.4-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy the built application
COPY . .

# Install only production dependencies
ENV NODE_ENV=production
RUN npm ci --only=production

# Expose the port the app runs on (Cloud Run expects $PORT)
EXPOSE 8080

# Start the Next.js app
CMD ["npm", "run", "start"]