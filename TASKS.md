# Authentication & User Management Implementation Plan

## Overview
Implement Google OAuth login/signup, user account management, and admin controls via Strapi. This plan ensures a robust, secure system with i18n support.

## Phases & Tasks

### Phase 1: Core Setup & Dependencies
- [x] Install NextAuth.js and Prisma adapter in `apps/web/`
- [x] Update Prisma schema with NextAuth tables and custom user fields
- [x] Run Prisma generate and db push
- [x] Add environment variables to `.env.local`
- [x] Set up Strapi content types and roles (content-only; user accounts managed by `web`)  
  - Added `allowedRoles` JSON field to `Demo`, `Solution`, and `CaseStudy` content types and created `apps/cms/scripts/ensure-allowed-roles.mjs` to update Strapi (requires `STRAPI_API_URL` + `STRAPI_API_TOKEN`).

### Phase 2: NextAuth Configuration
- [x] Create NextAuth route at `app/api/auth/[...nextauth]/route.ts`
- [x] Configure Google OAuth provider
- [x] Set up Prisma adapter and session handling
- [x] Add middleware for route protection
- [x] Update root layout with SessionProvider

### Phase 3: Login/Signup Pages
- [x] Create login page at `app/[locale]/login/page.tsx`
- [x] Implement Google sign-in button and logic
- [x] Add i18n support for English/Arabic
- [x] Handle signup flow (web authoritative); Strapi user creation disabled
- [x] Add error handling and pending approval messages

### Phase 4: User Account Management
- [x] Create account page at `app/[locale]/account/page.tsx`
- [x] Implement profile display and editing
- [x] Add logout functionality
- [x] Create API route for user updates
- [x] Implement access control based on user level

### Phase 5: Strapi Admin (Content) Integration
- [x] **Decision:** Web is authoritative for accounts and approvals — Strapi *will not* manage user accounts or approvals (profile sync disabled).
- [ ] Configure Strapi permissions for **content management** (roles, locales, publish workflows) — ensure server-side reads use API tokens for protected content.
- [x] Add `allowedRoles` to content types (Demos, Solutions, Case Studies) and provide an `apps/cms/scripts/ensure-allowed-roles.mjs` helper to enable the field in Strapi (requires `STRAPI_API_URL` + `STRAPI_API_TOKEN`).
- [ ] Ensure guidelines for editors: how to mark content as restricted and which roles map to each label.
- [ ] (Obsolete) User-management via Strapi: **deprecated** — keep for historical reference only; do not enable profile sync without re-evaluating security and workflow.

### Phase 6: Testing, Security & Polish
- [ ] Test login/signup flow manually
- [ ] Add unit tests for auth routes
- [ ] Implement security measures (CSRF, rate limiting)
- [ ] Polish UI/UX with loading states and notifications
- [ ] Optimize performance (caching, etc.)

### Phase 7: Deployment & Monitoring
- [ ] Test full system locally
- [ ] Set up production environment variables
- [ ] Add logging and error tracking
- [ ] Document deployment steps

## Notes
- Total estimated time: 3-5 days
- Test after each phase
- Commit changes regularly
- Use the provided Google OAuth keys

## Progress Tracking
- Start Date: January 25, 2026
- Current Phase: Phase 5
- Completed Tasks: Phases 1-4 mostly done
- Pending Tasks: Strapi setup, testing, polish