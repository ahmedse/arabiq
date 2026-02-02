# Current Task for Worker Agent

> **Last Updated**: 2026-02-02  
> **Status**: 🔴 ACTIVE TASK  
> **Priority**: HIGH  
> **Phase**: 1 of 4 - Foundation Completion

---

## Instructions for Worker Agent

Read this file to understand your current task. When complete, write your results to `TASK-RESULTS.md` in the same directory.

---

## TASK-002: Complete Page Sections & Account Management

### Priority: HIGH
### Estimated Effort: 6-8 hours
### Category: Web App Completion

---

## Objective

Ensure all pages render complete content from CMS, complete account management features, and add missing user flows.

---

## Context

TASK-001 established the foundation (loading states, error handling, UI components, contact form). Now we need to:
1. Verify all pages properly display CMS content (no missing sections)
2. Complete account management (profile editing, password change)
3. Add registration success page with email confirmation flow
4. Ensure admin functionality is complete

---

## Requirements

### 1. Registration Success Page

Create a registration success page that shows after user registers:

```
apps/web/app/[locale]/(auth)/registration-success/page.tsx
```

Requirements:
- Show different message based on `?confirmation=true` query param
- If confirmation required: "Check your email to verify your account"
- If no confirmation: "Your account is pending approval"
- Link to login page
- Professional styling matching auth pages

```tsx
// Example structure
export default function RegistrationSuccessPage({ searchParams }) {
  const needsConfirmation = searchParams?.confirmation === 'true';
  
  return (
    <div className="text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
      <h1>Account Created!</h1>
      {needsConfirmation ? (
        <p>Please check your email to verify your account.</p>
      ) : (
        <p>Your account is pending approval. We'll notify you once approved.</p>
      )}
      <Link href="/login">Go to Login</Link>
    </div>
  );
}
```

### 2. Account Page - Profile Editing

Update the account page to allow profile editing:

```
apps/web/app/[locale]/account/page.tsx
apps/web/app/[locale]/account/account-client.tsx
```

Features:
- Display current user info (name, email, phone, company, country)
- Edit mode toggle
- Form to update: displayName, phone, company, country
- Submit to `/api/account/update` → Strapi custom-auth/me PUT
- Show success/error feedback
- Loading states during submission

### 3. Account Page - Password Change

Add password change section to account page:

Features:
- Current password field
- New password field
- Confirm new password field
- Validation (passwords match, min length)
- Submit to `/api/account/password` → Strapi custom-auth/change-password
- Success/error feedback

Create API route:
```
apps/web/app/api/account/update/route.ts
apps/web/app/api/account/password/route.ts
```

### 4. Account Pending & Suspended Pages

Ensure these pages exist and are styled:

```
apps/web/app/[locale]/account-pending/page.tsx   # Already exists, verify styling
apps/web/app/[locale]/account-suspended/page.tsx # Already exists, verify styling
```

Requirements:
- Professional, empathetic messaging
- Clear next steps
- Contact support option
- Consistent styling with other pages

### 5. Access Denied Page

Ensure access denied page exists and is styled:

```
apps/web/app/[locale]/access-denied/page.tsx
```

Requirements:
- Clear message about why access was denied
- Link to appropriate next action
- Contact support option

### 6. Verify All Page Sections Render CMS Content

Check each page and ensure CMS data is properly rendered:

#### Homepage (`app/[locale]/page.tsx`)
- [ ] Hero section with CMS content
- [ ] Stats section (if enabled)
- [ ] Trusted By section (if enabled)
- [ ] How It Works section (if enabled)
- [ ] Features section (if enabled)
- [ ] Solutions section (if enabled)
- [ ] Industries section (if enabled)
- [ ] Case Studies section (if enabled)
- [ ] Demos section (if enabled)
- [ ] CTA section (if enabled)

#### About Page (`app/[locale]/about/page.tsx`)
- [ ] Hero section
- [ ] Mission & Vision
- [ ] Values from CMS
- [ ] Team members from CMS
- [ ] CTA section

#### Solutions Page (`app/[locale]/solutions/page.tsx`)
- [ ] Solutions list from CMS
- [ ] Proper grid layout
- [ ] Link to detail pages

#### Industries Page (`app/[locale]/industries/page.tsx`)
- [ ] Industries list from CMS
- [ ] Proper grid layout
- [ ] Link to detail pages

#### Case Studies Page (`app/[locale]/case-studies/page.tsx`)
- [ ] Case studies list from CMS
- [ ] Proper grid layout
- [ ] Link to detail pages

#### Detail Pages (`[slug]/page.tsx`)
- [ ] Solutions detail renders body content
- [ ] Industries detail renders body content
- [ ] Case Studies detail renders body content

### 7. Admin User Management Improvements

Review and improve admin users page:

```
apps/web/app/[locale]/admin/users/page.tsx
apps/web/app/[locale]/admin/users/admin-users-client.tsx
```

Ensure:
- [ ] List shows all pending users
- [ ] Approve button works
- [ ] Reject/suspend functionality works
- [ ] Search/filter users (if not present, add basic search)
- [ ] Loading states
- [ ] Error handling
- [ ] Success feedback after actions

### 8. Toaster Provider

Ensure toast notifications work site-wide:

```
apps/web/components/providers.tsx  # or similar
apps/web/app/[locale]/layout.tsx   # Add Toaster
```

Add react-hot-toast's Toaster component to the layout:
```tsx
import { Toaster } from 'react-hot-toast';

// In layout:
<Toaster 
  position="top-center"
  toastOptions={{
    duration: 4000,
    style: { background: '#363636', color: '#fff' }
  }}
/>
```

---

## Acceptance Criteria

- [ ] Registration success page created with conditional messaging
- [ ] Account page shows user profile information
- [ ] Account page allows editing profile (displayName, phone, company, country)
- [ ] Account page allows password change
- [ ] Profile update API route works
- [ ] Password change API route works
- [ ] Account pending page is styled professionally
- [ ] Account suspended page is styled professionally
- [ ] Access denied page is styled and helpful
- [ ] All homepage sections render CMS content when enabled
- [ ] About page renders values and team from CMS
- [ ] Solutions/Industries/Case Studies list pages work
- [ ] Detail pages render body content (rich text)
- [ ] Admin users page has approve/reject functionality
- [ ] Toaster is added to layout for site-wide toast support
- [ ] All forms have loading states and error handling
- [ ] RTL support maintained
- [ ] No TypeScript errors

---

## Files to Create

```
apps/web/app/[locale]/(auth)/registration-success/page.tsx
apps/web/app/api/account/update/route.ts
apps/web/app/api/account/password/route.ts
```

## Files to Modify

```
apps/web/app/[locale]/account/account-client.tsx  # Add profile edit & password change
apps/web/app/[locale]/account-pending/page.tsx    # Verify styling
apps/web/app/[locale]/account-suspended/page.tsx  # Verify styling
apps/web/app/[locale]/access-denied/page.tsx      # Verify or create
apps/web/app/[locale]/layout.tsx                  # Add Toaster
apps/web/app/[locale]/admin/users/admin-users-client.tsx  # Improve UX
```

---

## Technical Notes

### Profile Update API

```typescript
// apps/web/app/api/account/update/route.ts
import { cookies } from 'next/headers';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('strapi_jwt')?.value;
  
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  
  // Validate allowed fields
  const allowedFields = ['displayName', 'phone', 'company', 'country'];
  const data: Record<string, string> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  
  const res = await fetch(`${STRAPI_URL}/api/custom-auth/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    return Response.json({ error: error.error?.message || 'Update failed' }, { status: res.status });
  }
  
  return Response.json(await res.json());
}
```

### Password Change API

```typescript
// apps/web/app/api/account/password/route.ts
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('strapi_jwt')?.value;
  
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { currentPassword, newPassword } = await req.json();
  
  // Validation
  if (!currentPassword || !newPassword) {
    return Response.json({ error: 'All fields required' }, { status: 400 });
  }
  
  if (newPassword.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }
  
  const res = await fetch(`${STRAPI_URL}/api/custom-auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    return Response.json({ error: error.error?.message || 'Password change failed' }, { status: res.status });
  }
  
  return Response.json({ success: true });
}
```

### Rich Text Rendering

For body content (rich text from Strapi), use the existing richText utility:
```typescript
import { renderRichText } from '@/lib/richText';

// In component:
<div className="prose prose-lg max-w-none">
  {renderRichText(item.body)}
</div>
```

---

## References

- Account client: `apps/web/app/[locale]/account/account-client.tsx`
- Auth context: `apps/web/contexts/AuthContext.tsx`
- Strapi custom-auth: `apps/cms/src/api/custom-auth/controllers/custom-auth.ts`
- Rich text util: `apps/web/lib/richText.tsx`
- Admin users: `apps/web/app/[locale]/admin/users/`

---

## Next Tasks (Preview)

After TASK-002:
- **TASK-003**: SEO completion (meta tags, Open Graph, structured data)
- **TASK-004**: Email templates (welcome, approval, password reset)
- **TASK-005**: Security hardening (rate limiting, CSRF, CSP)

---
