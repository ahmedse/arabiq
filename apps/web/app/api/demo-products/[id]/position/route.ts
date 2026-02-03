/**
 * Demo Product Position API Route
 * Updates product hotspot position with full position data
 * Stores: anchorPosition, stemVector, nearestSweepId, floorIndex
 * Note: Strapi v5 requires documentId for updates, not id
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

interface PositionPayload {
  x: number;
  y: number;
  z: number;
  stemVector?: { x: number; y: number; z: number };
  nearestSweepId?: string;
  floorIndex?: number;
  roomId?: string;
  cameraRotation?: { x: number; y: number };
}

// GET handler for debugging route availability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ 
    message: 'Position route available',
    productId: id,
    method: 'GET'
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;
    const payload: PositionPayload = await request.json();
    
    // Validate position
    if (typeof payload.x !== 'number' || typeof payload.y !== 'number' || typeof payload.z !== 'number') {
      return NextResponse.json(
        { error: { message: 'Invalid position data' } },
        { status: 400 }
      );
    }

    // documentId is now passed directly from the frontend
    // No need to lookup - just use it directly for the update
    
    // Build complete hotspot position data
    // Stores anchor position + direction/normal for accurate tag placement
    const hotspotPosition = {
      // Anchor position (where the tag attaches)
      x: payload.x,
      y: payload.y,
      z: payload.z,
      // Stem vector (direction the tag points, from surface normal)
      stemVector: payload.stemVector || { x: 0, y: 0.3, z: 0 },
      // Nearest sweep ID for reliable navigation
      nearestSweepId: payload.nearestSweepId || null,
      // Floor index for multi-floor tours
      floorIndex: payload.floorIndex ?? null,
      // Room ID if available
      roomId: payload.roomId || null,
      // Camera rotation for accurate fly-to direction
      cameraRotation: payload.cameraRotation || null,
    };

    // Update in Strapi using documentId - hotspotPosition is a JSON field
    const response = await fetch(`${STRAPI_URL}/api/demo-products/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
      },
      body: JSON.stringify({
        data: {
          hotspotPosition,
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
    
    return NextResponse.json({ success: true, hotspotPosition });
    
  } catch (error) {
    console.error('[API] Position update error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
