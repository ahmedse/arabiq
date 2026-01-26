import { NextResponse } from 'next/server';

// Strapi profile sync is disabled. Keep the endpoint returning 410 to avoid accidental enabling.
export async function POST() {
  return NextResponse.json({ error: 'Strapi profile sync disabled' }, { status: 410 });
} 
