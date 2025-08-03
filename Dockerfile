# Builder stage: install deps and build
FROM node:20.19.4 AS builder
WORKDIR /usr/src/app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Force rebuild of native modules
RUN npm install --force
COPY . .
RUN npm run build
RUN npm prune --production

# Runner stage: production image
FROM node:20.19.4-slim AS runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.js ./next.config.js
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/package-lock.json ./package-lock.json
EXPOSE 8080
ENV PORT=8080
RUN npm ci --omit=dev
CMD ["npm", "start"]