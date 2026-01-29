# Authentication & User Management Implementation Plan

## Overview
Implement Google OAuth login/signup, user account management, and admin controls via Strapi. This plan ensures a robust, secure system with i18n support.

## Phases & Tasks

### Phase 1: Core Setup & Dependencies
- [x] Set up Strapi (v5) with Postgres and i18n
- [x] Configure Strapi auth (users, roles, approvals) and admin tokens
- [x] Add environment variables to `.env.local` (`STRAPI_URL`, `STRAPI_API_TOKEN`, `STRAPI_JWT_COOKIE_NAME`)
- [x] Set up Strapi content types and roles (include `allowedRoles` JSON field)
  - Added `allowedRoles` JSON field to `Demo`, `Solution`, and `CaseStudy` content types and created `apps/cms/scripts/ensure-allowed-roles.mjs` to update Strapi (requires `STRAPI_API_URL` + `STRAPI_API_TOKEN`).

### Phase 2: Strapi Configuration
- [x] Configure external providers (Google) in Strapi admin (optional)
- [x] Create roles and permissions in Strapi admin
- [x] Add server-side helpers in `apps/web` to read Strapi JWT cookie and validate sessions
- [x] Add middleware for route protection using Strapi session checks
- [x] Update root layout and components to use Strapi-backed user helpers

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
- [x] **Decision:** Strapi is authoritative for accounts and approvals — web uses Strapi JWT and server-side checks (profile sync optional).
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