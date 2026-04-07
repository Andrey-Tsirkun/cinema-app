FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/config/package.json ./packages/config/

# Reduce flaky ECONNRESET during registry downloads (especially on slow/unstable links).
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci

COPY apps/frontend ./apps/frontend
COPY packages/config ./packages/config

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev", "-w", "frontend"]
