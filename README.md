# cinema-app

Monorepo: Next.js frontend, NestJS backend, Prisma, PostgreSQL.

## Local development

1. Copy environment: `cp .env.example .env`
2. Install: `npm install`
3. Run Postgres (or use Docker only for DB): adjust `DATABASE_URL` for `localhost`
4. `npm run dev` — frontend http://localhost:3000, backend http://localhost:4000

## Docker

`docker compose` uses safe defaults from `docker-compose.yml` (same values as `.env.example`). Override by adding a `.env` file in this folder.

```bash
docker compose up --build
```

## Scripts (root)

- `npm run dev` — both apps
- `npm run build` — all workspaces that define `build`
- `npm run lint` — all workspaces that define `lint`
