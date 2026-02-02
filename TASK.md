# Current Task for Worker Agent

> **Last Updated**: 2026-02-02  
> **Status**: 🔴 ACTIVE TASK  
> **Priority**: MEDIUM  
> **Phase**: 2 of 4 - CMS/Web Polish (FINAL TASK)

---

## Instructions for Worker Agent

Read this file to understand your current task. When complete, write your results to `TASK-RESULTS.md` in the same directory.

---

## TASK-006: Final Testing & Production Prep

### Priority: MEDIUM
### Estimated Effort: 3-4 hours
### Category: Quality Assurance & Deployment

---

## Objective

Complete final testing, fix any remaining issues, and prepare the application for production deployment.

---

## Context

- TASK-001: ✅ Foundation (UI, error handling, contact form)
- TASK-002: ✅ Account management, admin, email (Resend)
- TASK-003: ✅ SEO, meta tags, translations, graceful fallbacks
- TASK-004: ✅ Security hardening (rate limiting, CSP, Zod validation)
- TASK-005: ✅ Performance optimization (images, lazy loading, caching)

This is the **final task** before Phase 2 completion. After this, we move to Phase 3 (VTour Demos).

---

## Requirements

### 1. Full Page Testing Checklist

Test every page in both English and Arabic:

#### Public Pages
- [ ] **Homepage** (`/en`, `/ar`)
  - Hero section renders
  - All sections show or hide based on CMS data
  - CTAs link correctly
  - Language switcher works
  
- [ ] **About** (`/en/about`, `/ar/about`)
  - Content renders from CMS
  - Values section shows if data exists
  - Team section shows if data exists
  
- [ ] **Contact** (`/en/contact`, `/ar/contact`)
  - Form submits successfully
  - Validation errors display
  - Rate limiting works (try 6+ submissions)
  - Success message appears
  
- [ ] **Solutions** (`/en/solutions`, `/ar/solutions`)
  - List page shows solutions from CMS
  - Detail pages (`/solutions/[slug]`) render content
  
- [ ] **Industries** (`/en/industries`, `/ar/industries`)
  - List page shows industries from CMS
  - Detail pages render content
  
- [ ] **Case Studies** (`/en/case-studies`, `/ar/case-studies`)
  - List page works
  - Detail pages render rich content
  
- [ ] **Demos** (`/en/demos`, `/ar/demos`)
  - List page works
  - Ready for Matterport integration later

#### Auth Pages
- [ ] **Login** (`/en/login`, `/ar/login`)
  - Form validation works
  - Login succeeds with valid credentials
  - Error shows for invalid credentials
  - Redirects to account after login
  
- [ ] **Register** (`/en/register`, `/ar/register`)
  - Form validation works
  - Registration creates pending user
  - Redirects to registration-success
  
- [ ] **Registration Success** (`/en/registration-success`)
  - Shows correct message
  
- [ ] **Forgot Password** (`/en/forgot-password`)
  - Form submits
  - Success message shows

#### Protected Pages
- [ ] **Account** (`/en/account`)
  - Shows user profile
  - Profile editing works
  - Password change works
  - Redirects to login if not authenticated
  
- [ ] **Account Pending** (`/en/account-pending`)
  - Shows for pending users
  
- [ ] **Account Suspended** (`/en/account-suspended`)
  - Shows for suspended users
  
- [ ] **Admin Users** (`/en/admin/users`)
  - Only accessible by admin role
  - Lists users
  - Approve/suspend actions work

### 2. Mobile Responsiveness Testing

Test on mobile viewport (375px width):

- [ ] Navigation menu toggles correctly
- [ ] All pages are readable
- [ ] Forms are usable
- [ ] Images scale properly
- [ ] No horizontal scroll
- [ ] Touch targets are large enough (48px min)

### 3. RTL (Arabic) Testing

- [ ] Text aligns right in Arabic
- [ ] Layout mirrors correctly
- [ ] Navigation works in RTL
- [ ] Forms align correctly
- [ ] Icons don't flip incorrectly

### 4. Error Handling Testing

- [ ] 404 page works (`/en/nonexistent`)
- [ ] Error boundary catches runtime errors
- [ ] API errors show user-friendly messages
- [ ] Network failures handled gracefully

### 5. Accessibility Testing

Run accessibility checks:

```bash
# Install axe-core for testing
pnpm add -D @axe-core/cli

# Run accessibility audit
npx axe http://localhost:3000/en --exit
```

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color contrast is sufficient
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

### 6. Environment Configuration

Create production environment template:

```bash
# .env.production.example
STRAPI_URL=https://cms.arabiq.tech
STRAPI_API_TOKEN=your_production_token
SITE_URL=https://arabiq.tech
RESEND_API_KEY=your_resend_key
ADMIN_EMAIL=admin@arabiq.tech
NODE_ENV=production

# Optional
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### 7. Build Verification

Verify production build works:

```bash
cd apps/web
pnpm build
pnpm start
# Test the production build locally
```

- [ ] Build completes without errors
- [ ] Production server starts
- [ ] All pages work in production mode
- [ ] No console errors

### 8. Documentation Updates

Update or create:

#### README.md Updates
- Installation instructions
- Environment variables list
- Development commands
- Deployment instructions

#### PRODUCTION_DEPLOYMENT.md
```markdown
# Production Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Strapi CMS deployed
- Domain configured

## Environment Setup
1. Copy `.env.production.example` to `.env.production`
2. Fill in all required values

## Build & Deploy
```bash
cd apps/web
pnpm install
pnpm build
pnpm start
```

## Post-Deployment Checklist
- [ ] Verify all pages load
- [ ] Test contact form
- [ ] Test login/register
- [ ] Check SSL certificate
- [ ] Verify DNS settings
- [ ] Set up monitoring
```

### 9. Fix Any Remaining Issues

Address any bugs found during testing:

- TypeScript errors
- Console warnings
- Broken links
- Missing translations
- Layout issues

---

## Acceptance Criteria

- [ ] All public pages work in EN and AR
- [ ] All auth flows work correctly
- [ ] Mobile responsive on all pages
- [ ] RTL layout works in Arabic
- [ ] Error pages display correctly
- [ ] Accessibility audit passes (no critical issues)
- [ ] Production build succeeds
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] No console errors in production

---

## Testing Commands

```bash
# Start CMS (in apps/cms)
pnpm develop

# Start Web (in apps/web)
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

---

## Files to Create/Update

```
apps/web/.env.production.example
apps/web/README.md (update if needed)
/PRODUCTION_DEPLOYMENT.md (update if needed)
```

---

## Issue Log Template

If issues are found, document them:

```markdown
### Issue: [Description]
**Page**: /en/page-name
**Severity**: Critical / High / Medium / Low
**Status**: Fixed / Pending
**Fix**: [What was done to fix it]
```

---

## Success Criteria

When this task is complete:
1. ✅ Phase 2 is COMPLETE
2. ✅ Site is production-ready
3. ✅ All features work end-to-end
4. ✅ Documentation is complete
5. 🚀 Ready for Phase 3: VTour Demos

---

## Next Phase Preview

**Phase 3: VTour Demo Experiences**
- 6 interactive Matterport demos
- E-commerce, Café, Hotel, Real Estate, Exhibition, Office
- AI Chatbot integration (Poe.com API)
- Booking/cart systems within virtual tours

---
