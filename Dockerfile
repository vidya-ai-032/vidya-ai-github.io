# Build stage
FROM node:20.19.4 AS builder
WORKDIR /usr/src/app

# Install TypeScript globally first
RUN npm install -g typescript@5

# Copy package files and TypeScript config
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for TypeScript)
ENV NODE_ENV=development
RUN npm install

# Verify TypeScript is installed and working
RUN npx tsc --version
RUN which tsc

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20.19.4-slim AS runner
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.ts ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]