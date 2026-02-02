import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rateLimit';
import { registerSchema, validateInput, validationErrorResponse } from '@/lib/validation';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(req: NextRequest) {
  try {
    // Rate limit check (3 per minute)
    const clientIP = getClientIP(req.headers);
    const { success: rateLimitOk, resetTime } = checkRateLimit(
      `register:${clientIP}`,
      RATE_LIMITS.register.limit,
      RATE_LIMITS.register.windowMs
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

    const validation = validateInput(registerSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const data = validation.data;

    // Register with Strapi via custom endpoint
    const strapiRes = await fetch(`${STRAPI_URL}/api/custom-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!strapiRes.ok) {
      const error = await strapiRes.json().catch(() => ({}));
      const message = error.error?.message || 'Registration failed';
      
      // Check for common errors
      if (message.toLowerCase().includes('email') && message.toLowerCase().includes('taken')) {
        return NextResponse.json(
          { success: false, error: 'Email is already registered', code: 'EMAIL_TAKEN' },
          { status: 400 }
        );
      }
      
      if (message.toLowerCase().includes('username') && message.toLowerCase().includes('taken')) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken', code: 'USERNAME_TAKEN' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: message },
        { status: strapiRes.status }
      );
    }

    const result = await strapiRes.json();

    console.log(`[Auth] Registration successful for ${data.email} (${clientIP})`);

    // Return result (may include user + message about pending approval)
    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('[Auth] Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
