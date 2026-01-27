Development setup recommendations (short)

Goal: Keep local DB persistent, make seeding reproducible, and avoid accidental data loss.

1) Use Postgres for local dev
   - Run Postgres in Docker (recommended):
     docker compose -f ../../docker-compose.cms.yml up -d
     # or: docker run --name arabiq-db -e POSTGRES_USER=arabiq -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=arabiq -p 5432:5432 -v arabiq_db:/var/lib/postgresql/data -d postgres:15
   - Update `apps/cms/.env.local` using the fields from `.env.example` and set `DATABASE_CLIENT=postgres` or set `DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public`

Seeding policy (important):
  - Seeding is manual by default: the seed scripts will check whether the DB already contains content. If content exists, they will prompt for confirmation before making changes.
  - To run non-interactively (CI or forced run), set `FORCE_SEED=1` or pass `--force` on the CLI.
  - Use seed scripts like `npm run seed` or `node seed-complete.mjs <token>` after starting CMS and ensuring `SEED_TOKEN` is present in `apps/cms/.env.local`.

2) Keep secrets out of git
   - Commit `apps/cms/.env.example` (placeholders) but never commit `.env.local`
   - Use a secrets manager (GitHub Actions secrets, Vault, etc.) for production

3) Use the seed scripts as content-as-code
   - Seed scripts (`apps/cms/seed-complete.mjs`, `seed.mjs`) are idempotent and safe to re-run
   - Run them with `SEED_TOKEN` in `.env.local` or pass token on the CLI: `node apps/cms/seed-complete.mjs <token>`

4) Backups & CI
   - Run periodic DB backups and/or export dumps before destructive actions
   - Add a CI job for production deploys that runs migrations and seeds (only for safe or idempotent seeds)

5) Quick developer workflow
   - Start DB (docker), set `.env.local`, start CMS with `./manage.sh dev cms`, create admin (or use `apps/cms/bootstrap-admin.mjs` / `admin/register-admin`), create API token, run `node apps/cms/seed-complete.mjs <token>`

If you want, I can:
 - add a Docker Compose file for Postgres and a `make` target, or
 - add a CI workflow example that runs seeds during deploy, or
 - move the existing admin/email change into an idempotent script tracked in `apps/cms/scripts/`.
Which do you prefer next? (I recommend Docker Compose + `.env.example` + CI seed step)