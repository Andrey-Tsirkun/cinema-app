FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/config/package.json ./packages/config/

RUN npm ci

COPY apps/frontend ./apps/frontend
COPY packages/config ./packages/config

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev", "-w", "frontend"]
