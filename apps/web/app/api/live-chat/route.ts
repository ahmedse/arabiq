/**
 * Live Chat SSE Endpoint
 * Real-time chat messages for VTour demos
 */

import { NextRequest } from 'next/server';
import { subscribeToChat, getMessages, markMessagesRead } from '@/lib/presence/store';
import type { ChatEvent } from '@/lib/presence/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const visitorId = searchParams.get('visitorId');
  const isOwner = searchParams.get('owner') === 'true';
  
  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }
  
  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial messages
      const messages = getMessages(slug, isOwner ? undefined : visitorId || undefined);
      const initialData = JSON.stringify({
        type: 'init',
        messages: messages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
        timestamp: new Date().toISOString(),
      });
      controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));
      
      // Mark messages as read
      if (visitorId) {
        markMessagesRead(slug, visitorId, isOwner ? 'owner' : 'visitor');
      }
      
      // Subscribe to chat events
      const unsubscribe = subscribeToChat(slug, (event: ChatEvent) => {
        // Filter events for visitors (only see their own messages)
        if (!isOwner && visitorId && event.message && event.message.visitorId !== visitorId) {
          return;
        }
        
        const data = JSON.stringify({
          type: event.type,
          message: event.message ? {
            ...event.message,
            timestamp: event.message.timestamp.toISOString(),
          } : undefined,
          visitorId: event.visitorId,
          isTyping: event.isTyping,
          timestamp: event.timestamp.toISOString(),
        });
        
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.log('Chat stream closed for', slug);
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
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
