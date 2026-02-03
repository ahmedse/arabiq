/**
 * Visitors API Route
 * Manage visitor registration, position updates, and help requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  addVisitor, 
  removeVisitor, 
  updateVisitorPosition, 
  requestHelp, 
  cancelHelpRequest,
  getVisitor,
  getVisitors 
} from '@/lib/presence/store';

// GET - List visitors for a demo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }
  
  const visitors = getVisitors(slug);
  return NextResponse.json({ visitors });
}

// POST - Register new visitor or update existing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, slug, sessionId, name, locale, userAgent, position, currentLocation } = body;
    
    if (!slug || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'join': {
        const visitor = addVisitor(slug, sessionId, name, locale, userAgent);
        return NextResponse.json({ visitor });
      }
      
      case 'leave': {
        removeVisitor(slug, sessionId);
        return NextResponse.json({ success: true });
      }
      
      case 'move': {
        if (!position) {
          return NextResponse.json(
            { error: 'Missing position parameter' },
            { status: 400 }
          );
        }
        const visitor = updateVisitorPosition(slug, sessionId, position, currentLocation);
        return NextResponse.json({ visitor });
      }
      
      case 'help_request': {
        const visitor = requestHelp(slug, sessionId);
        return NextResponse.json({ visitor });
      }
      
      case 'help_cancel': {
        const visitor = cancelHelpRequest(slug, sessionId);
        return NextResponse.json({ visitor });
      }
      
      case 'heartbeat': {
        // Just update lastSeenAt
        const existing = getVisitor(slug, sessionId);
        if (existing) {
          updateVisitorPosition(slug, sessionId, existing.position || { x: 0, y: 0, z: 0 }, existing.currentLocation);
        }
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Visitors API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
