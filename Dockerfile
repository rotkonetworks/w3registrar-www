FROM node:18 as build

RUN npm install -g pnpm

WORKDIR /App
COPY ./package.json pnpm-lock.yaml .
COPY ./.papi ./.papi
RUN pnpm install

COPY . .
RUN npx vite build

ENTRYPOINT npx serve --single dist
