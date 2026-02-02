import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rateLimit';
import { forgotPasswordSchema, validateInput, validationErrorResponse } from '@/lib/validation';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(req: NextRequest) {
  try {
    // Rate limit check (3 per 5 minutes - very strict to prevent email spam)
    const clientIP = getClientIP(req.headers);
    const { success: rateLimitOk, resetTime } = checkRateLimit(
      `forgot-password:${clientIP}`,
      RATE_LIMITS.forgotPassword.limit,
      RATE_LIMITS.forgotPassword.windowMs
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

    const validation = validateInput(forgotPasswordSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { email } = validation.data;

    // Request password reset from Strapi
    // Note: Strapi will send the email if configured
    const strapiRes = await fetch(`${STRAPI_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    // Always return success to prevent email enumeration attacks
    // Even if the email doesn't exist, we pretend it worked
    if (!strapiRes.ok) {
      console.log(`[Auth] Forgot password request for unknown email: ${email} (${clientIP})`);
    } else {
      console.log(`[Auth] Forgot password email sent to ${email} (${clientIP})`);
    }

    // Generic success message regardless of whether email exists
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, you will receive a password reset link shortly.',
    });

  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    
    // Still return success to prevent information leakage
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, you will receive a password reset link shortly.',
    });
  }
}
