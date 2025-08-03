# Use the official Node.js 18 image as the base image
FROM node:18-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (Cloud Run expects $PORT)
EXPOSE 8080

# Start the application
CMD ["node", "index.js"]
