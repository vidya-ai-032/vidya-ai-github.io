# 1. Install all dependencies, including devDependencies
FROM node:20.19.4 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Install both dependencies and devDependencies for build
RUN npm install

# 2. Build the Next.js app
FROM node:20.19.4 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Create the production image
FROM node:20.19.4-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the production output and necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Install only runtime dependencies
RUN npm ci --omit=dev

EXPOSE 8080
CMD ["npm", "run", "start"]