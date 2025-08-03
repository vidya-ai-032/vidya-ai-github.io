# 1. Base image
FROM node:20.19.4-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Install all dependencies (prod + dev) for build
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 3. Build the Next.js app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 4. Runtime image – only production assets & deps
FROM node:20.19.4-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./

# Install only production dependencies
RUN npm ci --omit=dev

USER nextjs
EXPOSE 8080
ENV PORT=8080 HOSTNAME="0.0.0.0"
CMD ["node","server.js"]