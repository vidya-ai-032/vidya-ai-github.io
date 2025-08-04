# Builder stage: install deps and build
FROM --platform=linux/amd64 node:20.19.4 AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_DISABLE_LIGHTNINGCSS=1

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_LIGHTNINGCSS=1
ENV NODE_OPTIONS="--max_old_space_size=4096"
ENV CSS_TRANSFORMER_WASM=1

# Copy package files and npm config
COPY package*.json ./

# Use npm install instead of npm ci to refresh the lockfile
RUN npm install --no-optional

# Copy the rest of the code
COPY . .

# Build the Next.js app with LightningCSS disabled
RUN npm run build:docker

# Runner stage: production image
FROM --platform=linux/amd64 node:20.19.4-slim AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Use non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]