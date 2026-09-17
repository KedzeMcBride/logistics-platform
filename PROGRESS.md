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