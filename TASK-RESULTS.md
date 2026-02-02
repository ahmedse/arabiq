# TASK-004: Security Hardening - Results

> **Completed**: 2026-02-02  
> **Status**: ✅ COMPLETE  
> **Build Status**: ✅ Passing

---

## Summary

Implemented comprehensive security hardening for production deployment including rate limiting, security headers, input validation, and secure cookie settings.

---

## Completed Work

### 1. Rate Limiting ✅

Created centralized rate limiting utility with configurable limits per route:

**File**: `apps/web/lib/rateLimit.ts`

| Route | Limit | Window |
|-------|-------|--------|
| `/api/contact` | 5 requests | 1 minute |
| `/api/auth/login` | 5 requests | 1 minute |
| `/api/auth/register` | 3 requests | 1 minute |
| `/api/auth/forgot-password` | 3 requests | 5 minutes |
| `/api/account/update` | 10 requests | 1 minute |
| `/api/account/password` | 3 requests | 1 minute |

Features:
- In-memory rate limiting (suitable for single-instance deployments)
- Automatic cleanup of expired entries
- Client IP detection from proxy headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP)
- Proper 429 responses with Retry-After headers

---

### 2. Security Headers ✅

**File**: `apps/web/next.config.ts`

Added comprehensive security headers:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-XSS-Protection` | `1; mode=block` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Content-Security-Policy` | See below |

**CSP Policy allows**:
- Scripts: self, unsafe-inline (Next.js), unsafe-eval (dev), Matterport
- Styles: self, inline (Tailwind), Google Fonts
- Images: self, blob, data, Matterport, Strapi, localhost
- Fonts: self, Google Fonts
- Connect: self, Matterport, Strapi, WebSockets (dev)
- Frames: self, Matterport embeds

---

### 3. Input Validation with Zod ✅

**File**: `apps/web/lib/validation.ts`

Installed Zod 4.3.6 and created validation schemas:

- `contactFormSchema` - Contact form validation
- `loginSchema` - Login form validation
- `registerSchema` - Registration form validation
- `forgotPasswordSchema` - Password reset request
- `resetPasswordSchema` - Password reset with confirmation
- `changePasswordSchema` - Password change with current password check
- `updateProfileSchema` - Profile update fields

Utility functions:
- `validateInput(schema, data)` - Returns typed data or field errors
- `validationErrorResponse(errors)` - Creates 400 response with errors
- `sanitize(str, maxLength)` - Trim and limit string length

---

### 4. Secure Cookie Settings ✅

**File**: `apps/web/lib/cookies.ts`

Cookie configurations:
- `AUTH_COOKIE_OPTIONS` - HttpOnly, Secure (prod), SameSite=Lax, 7 days
- `CLEAR_COOKIE_OPTIONS` - For secure cookie deletion
- `SESSION_COOKIE_OPTIONS` - Short-lived sessions (2 hours)
- `CSRF_COOKIE_OPTIONS` - Client-readable CSRF tokens

---

### 5. Environment Variable Validation ✅

**File**: `apps/web/lib/env.ts`

Validates required environment variables at startup:
- `STRAPI_URL` - Strapi CMS URL
- `SITE_URL` - Public site URL  
- `RESEND_API_KEY` - Email service (optional)
- `ADMIN_EMAIL` - Admin notifications (optional)
- `NODE_ENV` - Environment mode

In production, invalid env vars will prevent startup.

---

### 6. API Routes Updated/Created ✅

**Updated routes**:
- `app/api/contact/route.ts` - Simplified with new validation library
- `app/api/account/password/route.ts` - Added rate limiting + Zod validation
- `app/api/account/update/route.ts` - Added rate limiting + Zod validation
- `app/api/auth/logout/route.ts` - Uses secure cookie settings

**New routes**:
- `app/api/auth/login/route.ts` - Rate-limited login with secure cookies
- `app/api/auth/register/route.ts` - Rate-limited registration
- `app/api/auth/forgot-password/route.ts` - Rate-limited, prevents email enumeration

---

## Files Created

```
apps/web/lib/rateLimit.ts       # Rate limiting utility
apps/web/lib/validation.ts      # Zod schemas and validation helpers
apps/web/lib/cookies.ts         # Secure cookie configuration
apps/web/lib/env.ts             # Environment variable validation
apps/web/app/api/auth/login/route.ts
apps/web/app/api/auth/register/route.ts
apps/web/app/api/auth/forgot-password/route.ts
```

## Files Modified

```
apps/web/next.config.ts                  # Security headers
apps/web/app/api/contact/route.ts        # Use new validation library
apps/web/app/api/account/password/route.ts
apps/web/app/api/account/update/route.ts
apps/web/app/api/auth/logout/route.ts
apps/web/package.json                    # Added zod dependency
```

---

## Dependencies Added

```json
{
  "zod": "^4.3.6"
}
```

---

## Acceptance Criteria Checklist

- [x] Rate limiting implemented on all sensitive API routes
- [x] Security headers configured in next.config.ts
- [x] CSP policy allows Matterport, Strapi, and Google Fonts
- [x] Input validation with Zod on all form submissions
- [x] Secure cookie settings for auth tokens
- [x] Environment variables validated
- [x] No TypeScript errors
- [x] Build passes

---

## Testing Notes

### Rate Limiting Test
```bash
# Make 6 rapid requests to contact form
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@test.com","message":"Test message here"}';
  echo "";
done
# 6th request should return 429
```

### Security Headers Test
```bash
# Check response headers
curl -I http://localhost:3000/en | grep -E "X-|Strict|Content-Security|Referrer"
```

### Validation Test
```bash
# Send invalid data
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"invalid","message":""}'
# Should return 400 with field errors
```

---

## Next Steps

- **TASK-005**: Performance optimization (images, lazy loading, caching)
- **TASK-006**: Final testing and production deployment prep

---

## Notes

1. Rate limiting is in-memory - for multi-instance deployments, use Redis
2. Client-side auth pages still call Strapi directly - the new API routes are optional alternatives that provide server-side rate limiting
3. CSP is permissive for Matterport embeds - may need adjustment for other embedded content
4. Forgot-password always returns success to prevent email enumeration attacks
