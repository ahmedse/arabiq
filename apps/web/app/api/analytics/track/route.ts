/**
 * Analytics Track API Route
 * Receives user behavior data and stores for analytics
 */

import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

interface UserAction {
  type: string;
  demoId: number;
  sessionId: string;
  productId?: number;
  productName?: string;
  position?: { x: number; y: number; z: number };
  sweepId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { actions } = await request.json() as { actions: UserAction[] };
    
    if (!actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'Invalid actions data' },
        { status: 400 }
      );
    }
    
    // Process each action
    const results = await Promise.allSettled(
      actions.map(async (action) => {
        // Store in Strapi analytics collection
        const response = await fetch(`${STRAPI_URL}/api/analytics-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(STRAPI_TOKEN && { Authorization: `Bearer ${STRAPI_TOKEN}` }),
          },
          body: JSON.stringify({
            data: {
              eventType: action.type,
              demoId: action.demoId,
              sessionId: action.sessionId,
              productId: action.productId,
              productName: action.productName,
              position: action.position ? JSON.stringify(action.position) : null,
              sweepId: action.sweepId,
              metadata: action.metadata ? JSON.stringify(action.metadata) : null,
              eventTimestamp: action.timestamp,
            },
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to store action: ${response.status}`);
        }
        
        return response.json();
      })
    );
    
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    
    return NextResponse.json({
      success: true,
      processed: successful,
      failed,
    });
    
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    );
  }
}

// Handle preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
