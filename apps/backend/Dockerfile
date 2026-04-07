FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/config/package.json ./packages/config/

RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci

COPY apps/backend ./apps/backend
COPY packages/config ./packages/config

WORKDIR /app/apps/backend
RUN npx prisma generate

WORKDIR /app

ENV NODE_ENV=development

EXPOSE 4000

CMD ["sh", "-c", "npm run start:docker -w backend"]
