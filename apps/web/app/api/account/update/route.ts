import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rateLimit';
import { updateProfileSchema, validateInput, validationErrorResponse } from '@/lib/validation';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function PUT(req: NextRequest) {
  try {
    // Rate limit check
    const clientIP = getClientIP(req.headers);
    const { success: rateLimitOk, resetTime } = checkRateLimit(
      `account-update:${clientIP}`,
      RATE_LIMITS.accountUpdate.limit,
      RATE_LIMITS.accountUpdate.windowMs
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

    const validation = validateInput(updateProfileSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const data = validation.data;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided' },
        { status: 400 }
      );
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
      const error = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error?.message || 'Update failed' },
        { status: res.status }
      );
    }

    const updatedUser = await res.json();
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
