import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rateLimit';
import { changePasswordSchema, validateInput, validationErrorResponse } from '@/lib/validation';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const clientIP = getClientIP(req.headers);
    const { success: rateLimitOk, resetTime } = checkRateLimit(
      `password:${clientIP}`,
      RATE_LIMITS.passwordChange.limit,
      RATE_LIMITS.passwordChange.windowMs
    );
    
    if (!rateLimitOk) {
      return rateLimitResponse(resetTime);
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('strapi_jwt')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const validation = validateInput(changePasswordSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const { currentPassword, newPassword } = validation.data;

    const res = await fetch(`${STRAPI_URL}/api/custom-auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error?.message || 'Password change failed' },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
