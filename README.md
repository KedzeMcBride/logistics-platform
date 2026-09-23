# Logistics & Delivery Management Platform

# starting the backend api curl.exe http://localhost:3001/api/v1

# starting the webapp pnpm --filter @repo/web dev / pnpm --filter @repo/api dev

# staring the docker container for postgres and redis docker start logistics-postgres logistics-redis

# format with prettier pnpm format

# Open prisma DB pnpm --filter @repo/database db:studio

# mock test user customer@logistics.local / Password123!

# driver mock details driver@logistics.local / Password123!

A real-time logistics and delivery platform with live tracking, driver assignment,
admin operations, and AI-assisted dispatch.

## Stack

- **apps/web** — Next.js (App Router) — customer, driver, admin, ops UIs
- **apps/api** — NestJS — REST + WebSocket + BullMQ workers
- **packages/database** — Prisma schema and client
- **packages/shared** — shared types, enums, DTOs
- **packages/config** — shared TS/ESLint configs
- **PostgreSQL + PostGIS** — durable data + geospatial queries
- **Redis** — cache, queue backend, pub/sub, live driver geo index

## Getting Started

(Coming on Day 1 completion.)

## Documentation

- `docs/adr/` — Architecture Decision Records
- `PROGRESS.md` — daily build log

# Logistics & Delivery Management Platform

[![CI](https://github.com/KedzeMcBride/logistics-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/KedzeMcBride/logistics-platform/actions/workflows/ci.yml)

A real-time logistics and delivery platform with live tracking, driver assignment,
admin operations, and AI-assisted dispatch.

pnpm --filter @repo/database prisma migrate dev --name driver_response_tracking
pnpm --filter @repo/api typecheck
pnpm --filter @repo/api lint
pnpm --filter @repo/api test
pnpm --filter @repo/api build
