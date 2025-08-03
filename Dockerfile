# Stage 1: Install everything (prod + dev)
FROM node:20.19.4-slim AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci                   # installs devDependencies, including typescript

# Stage 2: Build with TS present
FROM node:20.19.4-slim AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build            # now finds typescript for next.config.ts

# Stage 3: Prod image with only runtime deps
FROM node:20.19.4-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/next.config.js ./
COPY --from=builder /usr/src/app/package.json ./
RUN npm ci --omit=dev
EXPOSE 8080
CMD ["npm","run","start"]