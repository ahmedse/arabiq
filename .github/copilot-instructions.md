# ArabIQ Project — Copilot Context & Instructions

## Project Overview

ArabIQ is a **reusable B2B AI Agent Engine** for virtual tour demos. Bilingual (EN/AR). Goal: sell it to businesses.

- **Website**: `beta.arabiq.tech` (Next.js App Router)
- **CMS**: `cms.arabiq.tech` (Strapi v5.33.4, Enterprise)
- **Database**: PostgreSQL 16 (local, NOT Docker)
- **LLM**: Poe API (SSE streaming) — Claude-3-Haiku (standard), GPT-4o-Mini (advanced)

## Architecture

```
apps/web/     → Next.js 15, App Router, [locale]/demos/[slug]
apps/cms/     → Strapi v5, i18n with documentId, PostgreSQL
seed/         → JSON data + JS seed scripts for all content
deploy/       → nginx configs, env files
```

### AI Agent Engine (`apps/web/lib/ai-engine/`)

- `agent-core.ts` — Main orchestrator, LLM-first reasoning
- `context-builder.ts` — System prompt + knowledge base injection
- `model-router.ts` — 3-tier Poe SSE routing, fixed \r\n parser
- `strapi-loader.ts` — CMS data bridge with 5-min TTL cache
- `tool-executor.ts` — 6 tools, offline fallback only
- `intent-classifier.ts` — Local keyword hints for routing
- `response-formatter.ts` — Action marker parsing
- `types.ts` — All TypeScript interfaces

### 6 Demo Types

| Slug | Type | Content |
|------|------|---------|
| awni-electronics | ecommerce | 10 products |
| cavalli-cafe | cafe | menu items |
| royal-jewel-hotel | hotel | rooms |
| office-for-sale | realestate | properties + rooms |
| trust-interior | showroom | products |
| eaac-training | training | rooms/facilities |

## Running the Project

**NO DOCKER.** Everything runs locally:

```bash
./manage.sh dev          # Start both web + cms
./manage.sh dev web      # Start only web (port 3000)
./manage.sh dev cms      # Start only cms (port 1337)
./manage.sh stop         # Stop all
./manage.sh logs cms     # View logs
./manage.sh status       # Check running status
```

### Database Access

```bash
PGPASSWORD='IDI5+1dEhv8FBGBGgegZJe4D9p/M7ndU2cNypGTdtcc=' psql -U arabiq -h localhost -d arabiq
```

### Seeding Data

```bash
cd seed/
SEED_TOKEN=$(grep '^SEED_TOKEN=' ../apps/cms/.env | cut -d '=' -f2) node seed.js        # Base data
SEED_TOKEN=$(grep '^SEED_TOKEN=' ../apps/cms/.env | cut -d '=' -f2) node seed-awni.js    # Awni demo
# Or seed all demos:
SEED_TOKEN=$(grep '^SEED_TOKEN=' ../apps/cms/.env | cut -d '=' -f2) bash seed-all-demos.sh
```

## Strapi v5 Specifics

- **i18n**: Separate row per locale. Same `documentId`, different `id`. Always filter by locale.
- **API tokens**: Use `SEED_TOKEN` from `apps/cms/.env` for seeding
- **Content types**: Located in `apps/cms/src/api/<name>/`
- **Bootstrap**: `apps/cms/src/index.ts` — creates roles + public permissions on every start

## CRITICAL LESSONS LEARNED

### ⚠️ NEVER create/modify CMS content type files while Strapi is running in dev mode

**THIS CAUSED A FULL DATA WIPE ON 2026-02-08.** Copilot MUST follow this protocol:

**What happened:** Creating content type files one-by-one while Strapi dev was running caused rapid hot-reloads. Strapi tried to restart with an incomplete content type (had schema.json + service but no controller/routes), crashed with `TypeError: Cannot read 'kind'`, and on the next startup it detected a schema mismatch — **Strapi v5 dev mode DROP+CREATE'd all content tables, wiping ALL data.**

**MANDATORY PROTOCOL for creating/modifying CMS content types:**
1. **STOP CMS first:**
   ```bash
   ./manage.sh stop cms
   ```
2. **Create ALL files for the content type** (schema.json, controller, service, routes) in one batch — NEVER incrementally
3. **Only then start CMS:**
   ```bash
   ./manage.sh start cms
   ```

**Files that trigger Strapi hot-reload (NEVER create while CMS runs):**
- `apps/cms/src/api/*/content-types/*/schema.json`
- `apps/cms/src/api/*/controllers/*.ts`
- `apps/cms/src/api/*/services/*.ts`
- `apps/cms/src/api/*/routes/*.ts`

### ⚠️ Auto-backup is enabled

`./manage.sh start cms` automatically backs up the DB before every CMS start. Backups go to `backups/db/arabiq-pre-start-*.sql.gz` (last 10 kept). You can also run `./manage.sh backup` manually.

### ⚠️ WSL Unclean Shutdown

WSL does not gracefully shut down PostgreSQL on Windows sleep/shutdown. PostgreSQL does crash recovery on next start. Combined with Strapi dev mode schema sync, this can compound into data loss. Always stop services before closing WSL.

## Task Tracking

- Completed tasks: T1-T6 (Agent Core → CMS AI Config)
- Current progress tracked in `TASK-RESULTS.md`
- Next task spec in `TASK.md`
- Design doc: `docs/AI-AGENT-ENGINE.md` (712 lines)
- Roadmap: `docs/DEVELOPMENT-ROADMAP.md`
