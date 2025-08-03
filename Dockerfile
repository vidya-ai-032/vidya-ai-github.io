# Stage 1: Install dependencies (including devDependencies)
FROM node:20.19.4-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including TypeScript and other devDependencies)
RUN npm ci

# Stage 2: Build the application
FROM node:20.19.4-slim AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy project files
COPY . .

# Build the Next.js app (TypeScript is now available)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Production image
FROM node:20.19.4-slim AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/next.config.ts ./

# Install only production dependencies
COPY --from=builder /app/package.json ./
RUN npm ci --omit=dev

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Use non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 8080
ENV PORT=8080 HOSTNAME="0.0.0.0"

# Start the app
CMD ["node", "server.js"]