# Current Task for Worker Agent

> **Last Updated**: 2026-02-02  
> **Status**: 🔴 ACTIVE TASK  
> **Priority**: HIGH  
> **Phase**: 2 of 4 - CMS/Web Polish

---

## Instructions for Worker Agent

Read this file to understand your current task. When complete, write your results to `TASK-RESULTS.md` in the same directory.

---

## TASK-004: Security Hardening

### Priority: HIGH
### Estimated Effort: 4-5 hours
### Category: Security & Production Readiness

---

## Objective

Harden the application for production with rate limiting, security headers, CSRF protection, and input validation.

---

## Context

- TASK-001: ✅ Foundation (UI components, error handling, contact form)
- TASK-002: ✅ Account management, admin features, email integration
- TASK-003: ✅ SEO, meta tags, translations, graceful fallbacks

Now we secure the application before production deployment.

---

## Requirements

### 1. Rate Limiting for API Routes

Implement in-memory rate limiting for development/simple deployments:

```typescript
// lib/rateLimit.ts
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}
```

**Apply to API routes:**

```typescript
// app/api/contact/route.ts
import { checkRateLimit } from '@/lib/rateLimit';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  // Get client IP
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 
             headersList.get('x-real-ip') || 
             'anonymous';

  // Check rate limit
  const { success, remaining } = checkRateLimit(`contact:${ip}`, 5, 60000);
  if (!success) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // ... rest of handler
}
```

**Routes to protect:**
- `app/api/contact/route.ts` - 5 requests/minute
- `app/api/auth/login/route.ts` - 5 requests/minute
- `app/api/auth/register/route.ts` - 3 requests/minute
- `app/api/auth/forgot-password/route.ts` - 3 requests/5 minutes
- `app/api/account/update/route.ts` - 10 requests/minute
- `app/api/account/password/route.ts` - 3 requests/minute

### 2. Security Headers (CSP, HSTS, etc.)

Update `next.config.ts` to add security headers:

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.matterport.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' blob: data: *.matterport.com *.strapi.io localhost:1337",
      "font-src 'self' fonts.gstatic.com",
      "connect-src 'self' *.matterport.com localhost:1337",
      "frame-src 'self' *.matterport.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ')
  }
];

// Add to nextConfig:
async headers() {
  return [{ source: '/:path*', headers: securityHeaders }];
}
```

### 3. Input Validation & Sanitization

Install Zod and create validation utility:

```bash
pnpm add zod
```

```typescript
// lib/validation.ts
import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address').max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long');

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100).trim(),
  email: emailSchema,
  phone: z.string().max(20).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000).trim(),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username required'),
  password: z.string().min(1, 'Password required'),
});

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  for (const error of result.error.errors) {
    errors[error.path.join('.')] = error.message;
  }
  
  return { success: false, errors };
}
```

### 4. Secure Cookie Settings

Create cookie configuration:

```typescript
// lib/cookies.ts
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
```

Update `lib/strapiAuth.ts` to use these settings when setting cookies.

### 5. Environment Variable Validation

```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  STRAPI_URL: z.string().url().default('http://localhost:1337'),
  STRAPI_API_TOKEN: z.string().optional(),
  SITE_URL: z.string().url().default('http://localhost:3000'),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
```

---

## Acceptance Criteria

- [ ] Rate limiting implemented on all sensitive API routes
- [ ] Security headers configured in next.config.ts
- [ ] CSP policy allows Matterport, Strapi, and Google Fonts
- [ ] Input validation with Zod on all form submissions
- [ ] Secure cookie settings for auth tokens
- [ ] Environment variables validated
- [ ] No TypeScript errors
- [ ] Build passes
- [ ] Forms still work correctly with new validation

---

## Files to Create

```
apps/web/lib/rateLimit.ts
apps/web/lib/validation.ts
apps/web/lib/cookies.ts
apps/web/lib/env.ts
```

## Files to Modify

```
apps/web/next.config.ts               # Add security headers
apps/web/app/api/contact/route.ts     # Add rate limiting, validation
apps/web/app/api/auth/login/route.ts  # Add rate limiting, validation
apps/web/app/api/auth/register/route.ts
apps/web/app/api/auth/forgot-password/route.ts
apps/web/app/api/account/update/route.ts
apps/web/app/api/account/password/route.ts
apps/web/lib/strapiAuth.ts            # Secure cookie settings
```

---

## Dependencies to Install

```bash
cd apps/web && pnpm add zod
```

---

## Testing Checklist

1. **Rate Limiting**: Make 6+ rapid requests to contact form, verify 429 response
2. **Security Headers**: Check response headers in DevTools Network tab
3. **Validation**: Submit invalid data, verify error messages
4. **Cookies**: Check cookie settings in DevTools Application tab
5. **Build**: `pnpm build` passes without errors

---

## Next Tasks (Preview)

After TASK-004:
- **TASK-005**: Performance optimization (images, lazy loading, caching)
- **TASK-006**: Final testing and production deployment prep

---
