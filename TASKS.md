# Authentication & User Management Implementation Plan

## Overview
Implement Google OAuth login/signup, user account management, and admin controls via Strapi. This plan ensures a robust, secure system with i18n support.

## Phases & Tasks

### Phase 1: Core Setup & Dependencies
- [x] Install NextAuth.js and Prisma adapter in `apps/web/`
- [x] Update Prisma schema with NextAuth tables and custom user fields
- [x] Run Prisma generate and db push
- [x] Add environment variables to `.env.local`
- [ ] Set up Strapi content types and roles (content-only; user accounts managed by `web`)

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

### Phase 5: Strapi Admin Integration
- [ ] Configure Strapi permissions for user management
- [ ] Set up admin workflow for approval/locking/deletion
- [ ] Implement API calls from Next.js to Strapi
- [ ] Add sync mechanism for user data

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