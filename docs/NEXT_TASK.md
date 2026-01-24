# NEXT_TASK

## Project Lead Plan (Web-first)
Goal: Transform arabiq.tech into a compelling, bilingual (EN/AR) marketing website showcasing Arabiq's AI-powered digital-twin platform vision (Vmall, AI Suite, Commerce)

Design Inspiration: **Stripe.com** (clean, premium, spacious, excellent gradients)

Team (2 agents):
- Agent-1: Frontend (UI components, pages, styling)
- Agent-2: Backend (CMS content, integrations, auth)

---

## CURRENT TASK #15 — Home Page Hero + Locale Filtering Fix

**Status:** 🔴 NEW  
**Priority:** HIGH  
**Assigned to:** Worker Agent

### Scope
`apps/web` — Create Stripe-inspired Hero sections and fix locale content filtering

### Context
✅ Task 14 complete! CMS has 54 bilingual entries.

**Issues found:**
1. ⚠️ **Locale mixing:** `/en/solutions` shows both "AI-Powered Solutions" AND "منصة Vmall" (mixed EN/AR)
2. ❌ **No hero sections:** Pages look plain
3. ❌ **Home page bland:** Needs Stripe-style hero with gradients

**Goal:** Create stunning home page + fix locale filtering so EN pages show ONLY EN content.

### Design Reference
**Stripe.com Hero elements:**
- Large bold headline (text-4xl to text-6xl)
- Gradient text or subtle gradient background
- Concise subtitle
- Two CTAs (primary + secondary)
- Generous padding (py-20 to py-28)
- Decorative gradient blobs

### Deliverables

See full detailed instructions above for:
1. Fix Strapi locale filtering in `lib/strapi.ts`
2. Create `components/sections/hero.tsx`
3. Create `components/sections/stats.tsx`
4. Redesign `app/[locale]/page.tsx` with hero + stats + previews
5. Update translation files

### When Done
Update `NEXT_TASK-RESULTS.md` with Task ID 15 results.
