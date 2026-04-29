# sportlive-monorepo

Sportlive.uz — sport va futbol yangiliklari sayti. Next.js 15 + TypeScript + PostgreSQL.

## Stack

- **App:** Next.js 15 (App Router) + React 19 + TypeScript
- **Style:** Tailwind v4 + shadcn/ui (kelajakda)
- **DB:** PostgreSQL 17 + Drizzle ORM
- **i18n:** next-intl (uz default at `/`, ru at `/ru`, en at `/en`)
- **Monorepo:** pnpm workspaces + Turborepo

## Layout

```
apps/
  web/                  # asosiy sayt (Next.js)
packages/
  db/                   # Drizzle schema + Postgres client
  ui/                   # umumiy React komponentlar
  config/               # umumiy tsconfig/eslint
docker/
  compose.dev.yml       # lokal Postgres
sportlive.uz/           # eski PHP sayt (lokal nusxa, git'ga kirmaydi)
```

## Boshlash

```bash
# 1. Bog'liqliklar
pnpm install

# 2. Lokal Postgres
pnpm db:up

# 3. .env
cp .env.example .env
# DATABASE_URL ni tekshiring (port 5433)

# 4. Schema migratsiyasi
pnpm --filter @sportlive/db db:push

# 5. Dev server
pnpm dev
# → http://localhost:3000
```

## Backuplar

Eski sayt backuplari `sportlive.uz/backups/` ichida (git'ga kirmaydi). Eng oxirgi to'liq snapshot: `2026-04-29-pre-nextjs/`.
