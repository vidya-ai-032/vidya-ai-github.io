# Build stage
FROM node:20.19.4-slim AS builder
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
ENV NODE_ENV=development
RUN npm install

# Copy source
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:20.19.4-slim AS runner
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
ENV NODE_ENV=production
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1

# Expose the port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]