/**
 * Demo Product Position API Route
 * Updates product hotspot position
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const position = await request.json();
    
    // Validate position
    if (typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
      return NextResponse.json(
        { error: { message: 'Invalid position data' } },
        { status: 400 }
      );
    }
    
    // Update in Strapi - hotspotPosition is a JSON field
    const response = await fetch(`${STRAPI_URL}/api/demo-products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
      },
      body: JSON.stringify({
        data: {
          hotspotPosition: {
            x: position.x,
            y: position.y,
            z: position.z,
          },
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || { message: 'Failed to update position' } },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[API] Position update error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
