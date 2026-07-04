# wa-broadcast-backend

Backend foundation (**Stage 0**) for the enterprise WhatsApp Broadcast Platform.

This is a **standalone Node.js service** that runs alongside — and completely
independently of — the existing Vite/React frontend. The frontend is not
modified or coupled to this service in any way.

> **Scope:** Stage 0 is the foundation *only*. No auth, no contacts, no
> broadcasts, no queues/workers, no scheduling. The single endpoint is a health
> check. Everything else is scaffolding future stages build on.

## Stack

Fastify · TypeScript · Prisma (PostgreSQL) · ioredis · BullMQ (init only) ·
Zod · Pino.

## Structure

```
server/
├── prisma/schema.prisma      # Prisma init — no application models yet
└── src/
    ├── config/               # env.ts (Zod-validated) + structured config
    ├── lib/                  # logger, prisma singleton, redis, bullmq init
    ├── errors/               # AppError + typed subclasses
    ├── middleware/           # central Fastify error handler
    ├── modules/health/       # health route + service (thin route, logic in service)
    ├── utils/                # response/date/id helpers, constants
    ├── types/                # shared types
    ├── app.ts                # builds & configures Fastify (no port binding)
    └── index.ts              # process lifecycle: boot, listen, graceful shutdown
```

## Prerequisites (local, no Docker)

- Node.js ≥ 20
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

## Setup

```bash
cd server
cp .env.example .env          # then edit DATABASE_URL / REDIS_URL if needed
npm install
npm run prisma:generate       # generate the Prisma client
npm run dev                    # start on http://localhost:4000
```

## Verify

```bash
curl -s http://localhost:4000/api/health | jq
```

Returns `200` with `status: "ok"` when Postgres and Redis are both reachable,
or `503` with `status: "degraded"` (and per-dependency detail) otherwise.

## Environment

All configuration is validated once at boot in `src/config/env.ts`. Nothing
else in the codebase reads `process.env` directly — consume `config` instead.

> Note: this service uses `.env` (the standard for a standalone Node/Prisma
> service), not `.env.local`.
