# Progress Log

## Day 1 — Monorepo Scaffold COMPLETE

### Completed
- [x] Git repo + `.gitattributes` (LF normalization)
- [x] pnpm workspace + Turborepo 2.10
- [x] Prettier + EditorConfig
- [x] `packages/config` (@repo/config) — shared tsconfig + eslint
- [x] `packages/shared` (@repo/shared) — constants, types, WS events
- [x] `packages/database` (@repo/database) — Prisma shell
- [x] `apps/api` (@repo/api) — NestJS 10, port 3001, GET /api/v1
- [x] `apps/web` (@repo/web) — Next.js 15.5, port 3000, landing page
- [x] `pnpm dev` at root starts both apps

### Environment
- Node 22.12, pnpm 9.15
- TypeScript 5.6+, Next 15.5.25, React 19
- NestJS 10, Tailwind v4 (CSS-first, no tailwind.config.ts)
- Prisma 5.22 (schema empty, models land Day 4)

### Key Decisions
- `@repo/config/tsconfig/*` package-name resolution for tsconfig extends
- `core.autocrlf=input` + `.gitattributes` normalize all text to LF
- API on 3001, web on 3000, no collision
- API global prefix `/api/v1`
- Component-based structure planned for web (deferred to Week 6)

### Problems Solved
- pnpm 12.4.2 broken shim → reinstalled via corepack → 9.15
- `@repo/config` not resolvable → added to root devDependencies + exports map
- `rootDir` resolved to wrong path → removed from base tsconfig
- NestJS decorator errors → `experimentalDecorators` + `emitDecoratorMetadata`
- CRLF line endings → `.gitattributes` + renormalize
- `packages/database` missing → recreated with all source files
- Stale lockfile → delete `pnpm-lock.yaml` and reinstall

## Day 2 — Docker Compose + Database (NEXT)
- [ ] `docker-compose.yml` with Postgres (PostGIS) + Redis
- [ ] Root `.env.example`
- [ ] Prisma connected to live Postgres
- [ ] `/health` endpoint pings DB + Redis

## Day 2 — Docker Compose + Database ✅ COMPLETE

### Completed
- [x] docker-compose.yml with postgis/postgis:16-3.4 and redis:7-alpine
- [x] Named volumes for persistence, healthchecks on both
- [x] PostGIS extension enabled in `logistics` database
- [x] Root `.env` + `.env.example` with DATABASE_URL and REDIS_URL
- [x] Prisma connected, first migration `init` applied
- [x] `HealthCheck` placeholder table created
- [x] ConfigModule + PrismaModule + RedisModule wired in API
- [x] `GET /api/v1/health` returns live db + redis status

### Notes
- Postgres: localhost:5432, user/pass/db: logistics
- Redis: localhost:6379, AOF persistence enabled
- Prisma 5.22.0
- NestJS 10, @nestjs/config 3.3, @nestjs/terminus 10.3, ioredis 6.x
- Docker containers do NOT auto-start; run `docker start logistics-postgres logistics-redis` after boot

### Problems Solved
- Prisma schema validator "line 11 invalid" — fixed by using `pnpm prisma migrate dev` (not `pnpm exec` or direct `.bin`)
- NestJS 12 packages incompatible with NestJS 10 — pinned to @nestjs/config@3.3.0 and @nestjs/terminus@10.2.3
- npm registry timeouts — retried, eventually succeeded
- Docker Desktop not running — started manually
- Both containers stopped after machine restart — documented `docker start` command

## Day 3 — Shared Types & Enums (NEXT)
- [ ] Enums: Role, DeliveryStatus, DeliveryPriority, DriverAvailability
- [ ] WS event names (already partially in packages/shared)
- [ ] API response types
- [ ] Imported by both api and web

## Day 3 — Shared Types & Contracts ✅ COMPLETE

### Completed
- [x] Enums as const objects: Role, DeliveryStatus, DeliveryPriority, DriverAvailability
- [x] Derived TS types via `(typeof X)[keyof typeof X]`
- [x] API response envelopes: ApiResponse<T>, ApiSuccess<T>, ApiError
- [x] Pagination types: Paginated<T>, PaginationQuery
- [x] Delivery DTOs: DeliverySummary, DeliveryDto
- [x] WS events + payload types
- [x] Zod schemas for query validation
- [x] Constants: APP_NAME, API_VERSION, API_PREFIX, PORTS
- [x] `@repo/shared` compiles to `dist/` (CommonJS via Node16 resolution)
- [x] apps/api imports @repo/shared (proven via /api/v1/meta)
- [x] apps/web imports @repo/shared

### Architecture Decisions
- Enums as const objects (not TS `enum`) — Prisma/Zod interop
- Zod 4 for runtime validation
- Shared package compiles to CommonJS (`module: Node16`)
- No `"type": "module"` in shared package.json
- `main`/`types` point to `dist/`, not `src/`
- `clean` scripts use `rimraf` for cross-platform support

### Problems Solved
- ESM/CJS mismatch (experimental warning) — switched shared to CommonJS
- `moduleResolution: "Node"` deprecated — switched to `Node16`
- `Remove-Item` not available in pnpm scripts (cmd.exe) — replaced with `rimraf`

## Day 4 — Prisma Schema v1 (NEXT)
- [ ] User, RefreshToken, CustomerProfile, DriverProfile, Vehicle, DriverDocument, Address
- [ ] Seed script with admin + customer + driver
- [ ] Migration `users_profiles`