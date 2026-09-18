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

## Day 4 — Prisma Schema v1 ✅ COMPLETE

### Completed

- [x] Models: User, RefreshToken, CustomerProfile, DriverProfile, Vehicle, DriverDocument, Address, AuditLog
- [x] Enums: Role, DriverAvailability
- [x] Migration `users_profiles` applied
- [x] Seed script creates 4 users + profiles + addresses + vehicle + documents
- [x] Password hashing via bcryptjs (10 rounds)
- [x] Prisma Studio verified
- [x] `packages/database/src/index.ts` re-exports `@prisma/client`

### Seed Users (password: Password123!)

- admin@logistics.local (ADMIN)
- ops@logistics.local (OPERATIONS_MANAGER)
- customer@logistics.local (CUSTOMER) — 2 addresses
- driver@logistics.local (DRIVER) — 1 vehicle, 2 docs, APPROVED

### Architecture Decisions

- Soft delete via deletedAt on User and Address
- RefreshToken has familyId for rotation + reuse detection
- AuditLog polymorphic via (entityType, entityId)
- bcryptjs instead of argon2 (no native build tools needed on Windows)
- Prisma enums mirror @repo/shared string-for-string

### Problems Solved

- argon2 required C++ build tools → switched to bcryptjs
- `console` not recognized → added @types/node to packages/database
- PowerShell quoting ate double quotes in psql commands → use here-strings

## Day 5 — CI Pipeline (NEXT)

- [ ] GitHub Actions: lint → typecheck → test → build
- [ ] Service containers for Postgres + Redis
- [ ] Prisma migrate + seed in CI

## Day 5 — CI Pipeline ✅ COMPLETE

### Completed

- [x] `.github/workflows/ci.yml` runs on push + PR
- [x] Service containers: postgis/postgis:16-3.4, redis:7-alpine
- [x] PostGIS extension enabled in CI Postgres
- [x] Pipeline: install → migrate → generate → build → seed → lint → format:check → typecheck → test
- [x] Frozen lockfile for reproducible installs
- [x] pnpm store cached between runs
- [x] CI badge in README (green)
- [x] Full green pipeline verified

### Architecture Decisions

- `pnpm/action-setup` reads version from `packageManager` in root `package.json`
- Explicit `pnpm --filter @repo/shared build` before monorepo build guarantees `dist/` exists in CI
- `--force` on lint and build to bypass Turbo cache while stabilizing
- `.eslintrc.js` excludes `plugin:import/recommended` to prevent `import/no-unresolved` on workspace packages
- `turbo.json` lint task inputs include `.eslintrc*` so config changes bust the cache

### Problems Solved

- pnpm version mismatch → rely on `packageManager` field
- `import/no-unresolved` on `@repo/shared` in CI → removed import plugin from extends
- Turbo cached stale lint results → added inputs to lint task, used `--force`
- API build ran before shared → explicit shared build first
- Workflow in wrong folder (`infrastructure/github/` → `.github/`)
- Duplicate `Setup pnpm` step → removed
- README Prettier failure in CI but not locally → resolved with clean config; debug step removed

## Day 6 — Authentication (NEXT)

- [ ] AuthModule: register, login, refresh, logout
- [ ] bcryptjs password hashing
- [ ] JWT access + refresh tokens with rotation
- [ ] Token reuse detection (family revocation)
- [ ] JwtAuthGuard + RolesGuard
- [ ] `@CurrentUser()` decorator
- [ ] `GET /users/me`, `PATCH /users/me`
- [ ] Integration tests

## Day 6 — Authentication ✅ COMPLETE

### Completed

- [x] POST /api/v1/auth/register — customer or driver, creates profile
- [x] POST /api/v1/auth/login — bcryptjs verification
- [x] POST /api/v1/auth/refresh — rotates tokens in same family
- [x] POST /api/v1/auth/logout — revokes refresh token
- [x] GET /api/v1/users/me — returns user + profile
- [x] PATCH /api/v1/users/me — updates phone, fullName, avatarUrl
- [x] JwtAuthGuard, RolesGuard, @CurrentUser() decorator
- [x] Refresh token reuse detection (family revocation)
- [x] Global ValidationPipe
- [x] Integration tests: 7/7 passing

### Architecture Decisions

- Access tokens: 15m JWT, stateless
- Refresh tokens: 30d opaque, SHA256-hashed in DB
- Family-based rotation: reuse revokes entire family
- Passport JWT strategy fetches user on every request
- bcryptjs cost factor 10
- Only CUSTOMER and DRIVER self-register
- `apps/api/.env.test` committed for test env; `.env` gitignored
- Turbo `globalEnv` declared for DATABASE_URL, REDIS_URL, JWT_* so tasks receive them

### Problems Solved

- NestJS v12 packages incompatible with v10 → pinned to v11/v10
- @types/passport-jwt missing → added
- JwtModuleOptions expiresIn type strict → cast to StringValue from ms
- dto/index.ts wrong re-export path
- Jest globals not found → added "types": ["node", "jest"] to tsconfig
- Test couldn't find DATABASE_URL in CI → turbo globalEnv + .env.test file

## Day 7 — Customer Frontend Foundation (NEXT)

- [ ] API client with auth interceptors
- [ ] Auth context (register/login/logout/refresh)
- [ ] Login and register pages
- [ ] Protected route middleware
- [ ] `/dashboard` placeholder
