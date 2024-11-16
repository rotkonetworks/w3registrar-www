FROM oven/bun:canary-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lockb ./
COPY .papi .papi
COPY .env .env

# Install dependencies
RUN bun install --verbose
# Post install scripts will update polkadot API metadata for different chains

FROM dependencies AS builder
COPY . .
RUN echo "\
const vite = require('vite');\
\
vite.build();\
" > ./build.js
RUN bun ./build.js

FROM base AS production
COPY --from=builder /app/dist /app/dist
RUN bun add serve
CMD ["bun", "run", "serve", "--single", "dist"]

FROM dependencies AS development
COPY . .
CMD ["bun", "run", "dev"]
