# Builder stage: install deps and build
FROM node:20.19.4-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production

# Runner stage: production image
FROM node:20.19.4-slim AS runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/next.config.js ./next.config.js
COPY --from=builder /usr/src/app/package.json ./package.json
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]