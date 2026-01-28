import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('strapi_jwt')?.value;

  if (token) {
    // Log logout to Strapi
    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    try {
      await fetch(`${STRAPI_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Failed to log logout to Strapi:', error);
    }
  }

  // Delete the JWT cookie
  cookieStore.delete('strapi_jwt');

  return NextResponse.json({ success: true });
}
