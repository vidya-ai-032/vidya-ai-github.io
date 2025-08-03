# Use the official Node.js 20 image as the base image
FROM node:20.19.4-slim

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


# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose the port the app runs on (Cloud Run expects $PORT)
EXPOSE 8080

# Start the Next.js app
CMD ["npm", "run", "start"]
