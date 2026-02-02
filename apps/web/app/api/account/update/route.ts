import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('strapi_jwt')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate allowed fields to prevent unauthorized updates
    const allowedFields = ['displayName', 'phone', 'company', 'country'];
    const data: Record<string, string> = {};
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Basic sanitization
        data[field] = String(body[field]).trim().slice(0, 255);
      }
    }

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
