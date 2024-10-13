FROM node:18

RUN npm install -g pnpm
WORKDIR /App
COPY . .
