FROM node:18 as build

RUN npm install -g pnpm

WORKDIR /App
RUN pnpm add polkadot-api
RUN node_modules/.bin/papi add -n polkadot_people polkadot
RUN node_modules/.bin/papi add -n ksmcc3_people kusama
RUN node_modules/.bin/papi add -n westend2_people westend
RUN node_modules/.bin/papi add -n paseo paseo

COPY ./package.json pnpm-lock.yaml .
RUN pnpm install

COPY . .
RUN node_modules/.bin/vite build

#RUN pnpm add serve
ENTRYPOINT npx serve --single dist
