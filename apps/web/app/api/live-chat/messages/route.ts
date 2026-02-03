/**
 * Live Chat Messages API Route
 * Send and receive chat messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { addMessage, getMessages, markMessagesRead, emitTyping } from '@/lib/presence/store';

// GET - Get messages for a conversation
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const visitorId = searchParams.get('visitorId');
  
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }
  
  const messages = getMessages(slug, visitorId || undefined);
  return NextResponse.json({ 
    messages: messages.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }))
  });
}

// POST - Send a message or emit typing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, slug, visitorId, senderId, senderType, senderName, content } = body;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'send': {
        if (!visitorId || !senderId || !senderType || !senderName || !content) {
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        
        const message = addMessage(slug, visitorId, senderId, senderType, senderName, content);
        return NextResponse.json({ 
          message: {
            ...message,
            timestamp: message.timestamp.toISOString(),
          }
        });
      }
      
      case 'read': {
        if (!visitorId || !senderType) {
          return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
          );
        }
        
        markMessagesRead(slug, visitorId, senderType);
        return NextResponse.json({ success: true });
      }
      
      case 'typing': {
        if (!visitorId) {
          return NextResponse.json(
            { error: 'Missing visitorId parameter' },
            { status: 400 }
          );
        }
        
        emitTyping(slug, visitorId, body.isTyping ?? true);
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Live chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
