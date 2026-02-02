import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rateLimit';
import { loginSchema, validateInput, validationErrorResponse } from '@/lib/validation';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/cookies';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(req: NextRequest) {
  try {
    // Rate limit check (5 per minute)
    const clientIP = getClientIP(req.headers);
    const { success: rateLimitOk, resetTime } = checkRateLimit(
      `login:${clientIP}`,
      RATE_LIMITS.login.limit,
      RATE_LIMITS.login.windowMs
    );
    
    if (!rateLimitOk) {
      return rateLimitResponse(resetTime);
    }

    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const validation = validateInput(loginSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { identifier, password } = validation.data;

    // Authenticate with Strapi
    const strapiRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    if (!strapiRes.ok) {
      const error = await strapiRes.json().catch(() => ({}));
      const message = error.error?.message || 'Invalid credentials';
      
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 }
      );
    }

    const { jwt, user } = await strapiRes.json();

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, jwt, AUTH_COOKIE_OPTIONS);

    // Check user status
    if (user.blocked) {
      cookieStore.delete(AUTH_COOKIE_NAME);
      return NextResponse.json(
        { success: false, error: 'Account is blocked', code: 'BLOCKED' },
        { status: 403 }
      );
    }

    if (user.accountStatus === 'suspended') {
      cookieStore.delete(AUTH_COOKIE_NAME);
      return NextResponse.json(
        { success: false, error: 'Account is suspended', code: 'SUSPENDED', redirectTo: '/account-suspended' },
        { status: 403 }
      );
    }

    if (user.accountStatus === 'pending') {
      return NextResponse.json({
        success: true,
        user,
        redirectTo: '/account-pending',
      });
    }

    console.log(`[Auth] Login successful for ${user.email} (${clientIP})`);

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
