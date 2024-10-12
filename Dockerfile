FROM node:18 as build

RUN npm install -g pnpm

WORKDIR /App
COPY ./package.json pnpm-lock.yaml .
COPY ./.papi ./.papi
RUN pnpm install
#RUN npx bun install

COPY . .
RUN npx vite build


FROM php:8.3-apache

ARG UID
ARG GID
RUN groupadd -g ${UID} httpd
RUN useradd httpd -m -u ${UID} -g ${GID}
RUN a2enmod rewrite

COPY --from=build /App/dist /var/www/html
COPY ./.htaccess /var/www/html
USER httpd

