/**
 * Demo Product Position API Route
 * Updates product hotspot position
 * Note: Strapi v5 requires documentId for updates, not id
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

    // First, find the product by numeric id to get documentId
    // Strapi v5 requires documentId for updates, not numeric id
    const lookupRes = await fetch(
      `${STRAPI_URL}/api/demo-products?filters[id][$eq]=${id}`, 
      {
        headers: {
          ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
        },
      }
    );

    if (!lookupRes.ok) {
      return NextResponse.json(
        { error: { message: 'Failed to lookup product' } },
        { status: 500 }
      );
    }

    const lookupData = await lookupRes.json();
    const product = lookupData.data?.[0];
    const documentId = product?.documentId;

    if (!documentId) {
      return NextResponse.json(
        { error: { message: 'Product not found' } },
        { status: 404 }
      );
    }
    
    // Update in Strapi using documentId - hotspotPosition is a JSON field
    const response = await fetch(`${STRAPI_URL}/api/demo-products/${documentId}`, {
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
