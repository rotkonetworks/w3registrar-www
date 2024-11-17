FROM oven/bun:canary-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lockb ./
COPY .papi .papi
COPY .env .env

# Install dependencies
RUN bun install

FROM dependencies AS builder
COPY . .

# Following dependencies require patching, otherwise, will produce following error:
#    Cannot find module "../data/patch.json" from "undefined"    
# Ref: https://github.com/oven-sh/bun/issues/13076#issuecomment-2451515462
RUN echo -e '\
import * as patch from "../data/patch.json"\n\
\n\
export default patch;\n\
' > ./node_modules/css-tree/lib/data-patch.js
RUN echo -e '\
export { version } from "../package.json";\n\
' > ./node_modules/css-tree/lib/version.js

# vite build will fail with 
#   error during build:
#   undefined
# So this script is required to get actual error message:
RUN echo -e "\
const vite = require('vite');\n\
\n\
vite.build();\n\
" > ./build.js
RUN bun ./build.js

FROM base AS production
COPY --from=builder /app/dist /app/dist
RUN bun add serve
CMD ["bunx", "serve", "--single", "dist"]

FROM dependencies AS development
COPY . .
CMD ["bun", "run", "dev"]
