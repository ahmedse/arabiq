# Task 15 — Detailed Implementation Guide

## Home Page Hero + Locale Filtering Fix

### Summary
Create Stripe-inspired Hero component and fix Strapi locale filtering to prevent EN/AR content mixing.

---

## Full Task Details

See `/home/ahmed/arabiq/docs/NEXT_TASK.md.bak` lines 1-400 for complete implementation instructions including:

1. **Fix Strapi Locale Filtering** (`lib/strapi.ts`)
2. **Create Hero Component** (`components/sections/hero.tsx`)
3. **Create Stats Component** (`components/sections/stats.tsx`)
4. **Redesign Home Page** (`app/[locale]/page.tsx`)
5. **Update Translations** (`messages/en.json`, `messages/ar.json`)

Or copy content from the backup file.

---

## Quick Summary for Worker

**Main Tasks:**
1. Fix locale filtering bug (EN pages showing AR content)
2. Build Hero component with Stripe gradients
3. Build Stats bar component
4. Redesign home page with hero + stats + content previews
5. Add translation keys

**Key Files:**
- `apps/web/lib/strapi.ts` - Fix locale parameter passing
- `apps/web/components/sections/hero.tsx` - New Stripe-style hero
- `apps/web/components/sections/stats.tsx` - New stats bar
- `apps/web/app/[locale]/page.tsx` - Complete redesign
- `apps/web/messages/*.json` - Add home page translations

**Testing:**
```bash
# Verify locale separation
curl -s http://localhost:3000/en/solutions | grep '<h3' | head -5  # Only EN
curl -s http://localhost:3000/ar/solutions | grep '<h3' | head -5  # Only AR
```
