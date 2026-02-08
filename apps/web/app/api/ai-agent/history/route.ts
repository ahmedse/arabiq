/**
 * @fileoverview AI Agent Chat History API
 * 
 * GET /api/ai-agent/history?sessionId=xxx
 * Returns conversation messages for an existing session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversationHistory, isSessionValid } from '@/lib/ai-engine/memory-manager';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }
    
    if (!isSessionValid(sessionId)) {
      return NextResponse.json(
        { messages: [], valid: false },
        { status: 200 }
      );
    }
    
    const messages = getConversationHistory(sessionId);
    
    return NextResponse.json({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        actions: m.actions,
      })),
      valid: true,
      count: messages.length,
    });
    
  } catch (error) {
    console.error('[API /ai-agent/history] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', messages: [] },
      { status: 500 }
    );
  }
}
