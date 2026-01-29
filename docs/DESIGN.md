# Arabiq — Detailed Tech Specs & Design Doc (Copilot-ready)

You can paste this into docs/DESIGN.md and let Copilot scaffold from it.

## 1) System Overview
### 1.1 Components
**Web App (Next.js) — arabiq.tech**
- Public marketing pages (EN/AR)
- Auth (Google OAuth)
- Protected Demos portal
- Admin approvals UI (minimal, internal)
- Fetches content from Strapi (read-only)
- Uses Postgres for user/session + approvals

**CMS (Strapi) — cms.arabiq.tech**
- Content management with locales en and ar
- Stores media (Phase 1: local uploads volume)
- Uses existing Postgres DB arabiq_strapi

**Postgres (existing)**
- DBs:
  - arabiq_strapi
  - arabiq_app (Auth + approvals + demo access)

**Redis (existing)**
- Rate limiting + caching (optional in Phase 1, recommended in Phase 2)

**Nginx (existing)**
- TLS termination + reverse proxy for both hosts

## 2) Repo Structure (choose and stick to it)
**Option A: Monorepo (recommended for one-team VPS deployment)**
```
arabiq/
  apps/
    web/        # Next.js
    cms/        # Strapi
  infra/
    nginx/
    docker/
  docs/
```

**Option B: Two repos**
- arabiq-web (Next.js)
- arabiq-cms (Strapi)

Pick A unless you have a strong reason. It simplifies ops and env management.

## 3) Next.js Web App — Technical Spec
### 3.1 Framework
- Next.js 14+ (App Router)
- TypeScript strict
- Tailwind CSS
- Authentication & user management: **Strapi** (with optional social providers configured in Strapi)
- Postgres for Strapi (content & auth data)

### 3.2 Routing & i18n
All pages exist under app/[locale]/...
Supported locales: en, ar

**Middleware:**
- redirect / → /en
- validate locale param
- protect demos routes
- HTML attributes

For Arabic pages: lang="ar" and dir="rtl"
For English: lang="en" and dir="ltr"

### 3.3 Pages (App Router)
**Public:**
- /{locale}/ home
- /{locale}/solutions
- /{locale}/solutions/[slug]
- /{locale}/industries
- /{locale}/industries/[slug]
- /{locale}/case-studies
- /{locale}/case-studies/[slug]
- /{locale}/about
- /{locale}/contact

**Auth:**
- /{locale}/login
- /{locale}/access-pending

**Protected:**
- /{locale}/demos
- /{locale}/demos/[slug]
- /{locale}/demos/internal/ai-chat
- /{locale}/demos/internal/analytics

**Admin (internal):**
- /{locale}/admin/users (approve/reject users)
- /{locale}/admin/grants (optional per-demo grants)

### 3.4 Auth — Google Only (Auth.js)
**Provider:** Google
**Session strategy:** JWT or DB sessions (DB sessions recommended for server-side gating clarity)

After sign-in callback:
- ensure a UserApproval record exists:
  - if new user → PENDING

**Protect /demos:**
- must be authenticated
- must be APPROVED

**Admin authorization**
- ADMIN_EMAILS allowlist in env
- Only allow these to access /admin/*

### 3.5 Access Control Rules (Authoritative)
Anyone can browse marketing pages.

**/demos/*:**
- If not logged in → redirect to /{locale}/login
- If logged in and approval=PENDING → redirect to /{locale}/access-pending
- If logged in and approval=APPROVED → allow
- If approval=REJECTED → show rejected message + contact CTA
- Optional (phase 1.5): per-demo grant

If demo has accessMode=PER_DEMO_GRANT, require DemoAccess record for that user.

### 3.6 Data Access to Strapi
Strapi is the source of truth for content. Next.js fetches:
- Site settings
- Page sections
- Solutions/Industries/Case studies
- Demos directory

**Caching:**
- Marketing pages: ISR revalidate 60–600 seconds
- Demos listing/details: can be ISR but access check is dynamic (split content vs gating)

### 3.7 Matterport SDK Embed (spec)
For demo type MATTERPORT_SDK:
- Render a protected page
- Load Matterport Showcase + SDK using the bundle key (from env)
- Embed by model id / showcase url stored in Strapi
- Ensure CSP allows required Matterport domains

Note: SDK key must remain server-side where possible; if it must be used client-side, restrict it in Matterport settings as much as possible.

## 4) Data Model (Strapi collections)
All application-level auth/approval data should live in Strapi collections (backed by Postgres). Recommended collections and fields below.

### 4.1 Collections (recommended)

**UserApproval (collection):**
- user (relation to Strapi user)
- status enum: PENDING, APPROVED, REJECTED
- notes
- timestamps

**DemoGrant (optional):**
- user (relation)
- demoSlug (string)
- grantedAt, expiresAt

**UserProfile (optional fields or collection):**
- company, phone, country, jobTitle

### 4.2 Migrations & Seed
- Strapi manages its own schema; use `apps/cms/seed.mjs` with an Admin API token to seed roles and initial admin user(s).
- Recommended: Strapi content and auth in a single Postgres DB (or separate DBs if desired for isolation).

## 5) Strapi CMS — Technical Spec
### 5.1 Locales
- Enable i18n plugin
- Locales: en, ar

### 5.2 Content Types
Minimum set:

**SiteSettings (single)**
- siteName
- logo
- defaultSEO

**Solution (collection)**
- slug (unique)
- title (localized)
- shortDescription (localized)
- body (localized)
- icon (media)
- featured (bool)

**Industry (collection)**
- slug
- title (localized)
- description (localized)
- coverImage

**CaseStudy (collection)**
- slug
- title (localized)
- overview/challenge/solution/results (localized)
- gallery (media)
- tags

**Demo (collection)**
- slug
- title (localized)
- summary (localized)
- thumbnail
- demoType enum:
  - INTERNAL_PAGE
  - EXTERNAL_LINK
  - MATTERPORT_SDK
- externalUrl (string) if EXTERNAL_LINK (e.g., vmall URL)
- internalPath (string) if INTERNAL_PAGE
- matterportModelId OR showcaseUrl if MATTERPORT_SDK
- requiresApproval (bool true)
- accessMode enum:
  - GLOBAL_APPROVAL_ONLY
  - PER_DEMO_GRANT

### 5.3 Permissions
- Public role: read-only for content that is meant to be public
- Demos content can still be publicly readable as metadata; gating is in Next.js
- If you want to hide even demo metadata, mark demos as non-public and fetch using a Strapi API token from server-side only.
- Recommendation: keep demo metadata server-only via API token to reduce leakage.

## 6) Nginx & TLS (spec)
- arabiq.tech → proxy to web:3000
- cms.arabiq.tech → proxy to cms:1337
- Force HTTPS
- Add security headers
- Add upload size limit for Strapi (e.g., client_max_body_size 50m;)

Optional protection for CMS:
- Basic auth in Nginx or IP allowlist

## 7) Docker Compose (spec-level)
Services:
- web (Next.js)
- cms (Strapi)
- optional: adminer/pgadmin (internal only)

Connect to existing Postgres/Redis (either host network or defined endpoints)

Volumes:
- cms_uploads:/app/public/uploads (or Strapi uploads path)

## 8) Operational Workflows
### 8.1 Content editing
- Admin logs into cms.arabiq.tech
- Edits localized content entries
- Web app reflects updates by ISR within revalidate window (or manual redeploy if you choose)

### 8.2 User approval
- Admin goes to arabiq.tech/en/admin/users
- Approves pending users
- Approved users gain access to demos immediately

## Answers to your question: “Do I need to pay Google?”
No. Google OAuth sign-in is free to use for this scenario. You just configure OAuth credentials in Google Cloud Console.

---

## Decisions (from latest input)
- vmall.arabiq.tech exists, but **out of scope** for now (no iframe/new-tab handling needed yet).
- Focus on **web + simple demos** (backend logic for chat, e‑commerce, cafe booking, etc.).

## Assumption (can be changed)
**Demo metadata** should be **server-only** via Strapi API token (minimize leakage). If you want public demo titles later, we can flip permissions.

---

## Step-by-step Implementation Checklist (Web Focus)
### 0) Repo structure (monorepo)
- Create structure:
  - apps/web (Next.js)
  - apps/cms (Strapi)
  - infra/nginx
  - infra/docker
  - docs

### 1) Next.js app bootstrap
- Next.js 14+ (App Router), TypeScript strict, Tailwind CSS.
- Use Strapi (v5) as the canonical authentication provider (JWT cookie + admin tokens).
- Configure i18n routing under app/[locale]/…

### 2) Middleware & i18n
- Redirect / → /en.
- Validate locale param (allow en, ar else 404/redirect).
- Add lang/dir attributes: ar = rtl, en = ltr.
- Protect /demos and /admin routes in middleware.

### 3) Auth + approvals
- Google-only provider.
- Use Strapi's user approvals and server-side checks (no Prisma).
- On sign-in: ensure UserApproval exists; create PENDING on first login.
- Admin allowlist via ADMIN_EMAILS env.

### 4) Access control logic
- /demos/*:
  - Not logged in → /{locale}/login
  - PENDING → /{locale}/access-pending
  - APPROVED → allow
  - REJECTED → show rejection + contact CTA
- Optional per-demo grants (phase 1.5).

### 5) Strapi content fetching
- Server-side fetch to Strapi using API token (server-only).
- ISR revalidate:
  - Marketing pages: 60–600 seconds
  - Demos metadata: ISR OK, but gate on server at request time

### 6) Demos (simple + internal)
- Add demo records in Strapi for:
  - AI chat demo
  - E-commerce demo
  - Cafe booking demo
- Implement internal demo pages under /{locale}/demos/internal/*.
- Define minimal server actions / API routes as needed (mock or real logic).

### 7) Admin approvals UI
- Minimal pages:
  - /{locale}/admin/users → list pending users + approve/reject
- Optional /admin/grants if per-demo grants activated.

### 8) Strapi content models & migrations
- Manage user approvals, roles, and demo grants within Strapi collections.
- Use Strapi admin UI or seed scripts (`apps/cms/seed.mjs`) to populate initial data.

### 9) Nginx
- Add server blocks for arabiq.tech and cms.arabiq.tech.
- Force HTTPS, add security headers, set upload limit for Strapi.

### 10) Docker Compose (spec-level)
- web (Next.js)
- cms (Strapi)
- optional adminer/pgadmin (internal only)
- Connect to existing Postgres/Redis endpoints.

---

## Note: Prisma experiment rolled back
The Prisma/Auth.js experiment was rolled back. Strapi collections and seed scripts are the canonical source for user approvals, roles, and demo grants. See `apps/cms/seed.mjs` and Strapi docs for guidance.
}

model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  refresh_token      String?
  access_token       String?
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String?
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

model UserApproval {
  id        String         @id @default(cuid())
  userId    String         @unique
  status    ApprovalStatus @default(PENDING)
  notes     String?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model DemoGrant {
  id        String   @id @default(cuid())
  userId    String
  demoSlug  String
  grantedAt DateTime @default(now())
  expiresAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([demoSlug])
  @@unique([userId, demoSlug])
}

model UserProfile {
  id       String  @id @default(cuid())
  userId   String  @unique
  company  String?
  phone    String?
  country  String?
  jobTitle String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Nginx Server Blocks Outline (VPS)
Below is a minimal outline; add SSL cert paths and upstream hostnames as needed.

```nginx
# arabiq.tech
server {
  listen 80;
  server_name arabiq.tech www.arabiq.tech;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name arabiq.tech www.arabiq.tech;

  # ssl_certificate     /etc/letsencrypt/live/arabiq.tech/fullchain.pem;
  # ssl_certificate_key /etc/letsencrypt/live/arabiq.tech/privkey.pem;

  # security headers (example)
  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  add_header Permissions-Policy camera=(), microphone=(), geolocation=() always;

  location / {
    proxy_pass http://web:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# cms.arabiq.tech
server {
  listen 80;
  server_name cms.arabiq.tech;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name cms.arabiq.tech;

  # ssl_certificate     /etc/letsencrypt/live/cms.arabiq.tech/fullchain.pem;
  # ssl_certificate_key /etc/letsencrypt/live/cms.arabiq.tech/privkey.pem;

  client_max_body_size 50m;

  location / {
    proxy_pass http://cms:1337;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
