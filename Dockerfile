# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ARG APP_VERSION=0.0.1
ARG GIT_SHA=unknown
ENV APP_VERSION=$APP_VERSION
ENV GIT_SHA=$GIT_SHA

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3002

CMD ["node", "dist/main.js"]
