# Builder stage: install deps and build
FROM --platform=linux/amd64 node:20.19.4-alpine AS builder
WORKDIR /app

# Install only essential dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm install --omit=optional

# Copy source code
COPY . .

# Use existing Tailwind and PostCSS configs

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV CSS_TRANSFORMER_WASM=1

# Build using Docker-specific configuration
RUN npm run build:docker

# Production stage
FROM --platform=linux/amd64 node:20.19.4-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]