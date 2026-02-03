/**
 * Presence SSE Endpoint
 * Real-time updates for visitor presence in VTour demos
 */

import { NextRequest } from 'next/server';
import { subscribeToPresence, getVisitors, setOwnerOnline } from '@/lib/presence/store';
import type { PresenceEvent, Visitor } from '@/lib/presence/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const isOwner = searchParams.get('owner') === 'true';
  
  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial state
      const visitors = getVisitors(slug);
      const initialData = JSON.stringify({
        type: 'init',
        visitors,
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));
      
      // Mark owner as online if applicable
      if (isOwner) {
        setOwnerOnline(slug, true);
      }
      
      // Subscribe to presence events
      const unsubscribe = subscribeToPresence(slug, (event: PresenceEvent) => {
        const data = JSON.stringify({
          type: event.type,
          visitor: serializeVisitor(event.visitor),
          timestamp: event.timestamp.toISOString(),
        });
        
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          // Stream closed
          console.log('Presence stream closed for', slug);
        }
      });
      
      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000);
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(pingInterval);
        if (isOwner) {
          setOwnerOnline(slug, false);
        }
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Serialize visitor for JSON (handle Date objects)
function serializeVisitor(visitor: Visitor): Record<string, unknown> {
  return {
    ...visitor,
    connectedAt: visitor.connectedAt.toISOString(),
    lastSeenAt: visitor.lastSeenAt.toISOString(),
  };
}
