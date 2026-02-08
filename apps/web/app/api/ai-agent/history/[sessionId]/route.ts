/**
 * @fileoverview Session History API
 * 
 * Retrieve conversation history for session restore.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, isSessionValid } from '@/lib/ai-engine';

/**
 * GET /api/ai-agent/history/[sessionId]
 * Get conversation history for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Check if session is valid
    if (!isSessionValid(sessionId)) {
      return NextResponse.json(
        {
          error: 'Session not found or expired',
          sessionId,
        },
        { status: 404 }
      );
    }
    
    // Get session data
    const session = getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        {
          error: 'Session not found',
          sessionId,
        },
        { status: 404 }
      );
    }
    
    // Return session history
    return NextResponse.json(
      {
        sessionId: session.sessionId,
        demoSlug: session.demoSlug,
        locale: session.locale,
        messages: session.messages,
        messageCount: session.messages.length,
        lastActivity: new Date(session.lastActivity).toISOString(),
        metadata: session.metadata,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('[API /ai-agent/history] Error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ai-agent/history/[sessionId]
 * Clear a session (start fresh)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Import clearSession here to avoid circular dependency
    const { clearSession } = await import('@/lib/ai-engine/memory-manager');
    clearSession(sessionId);
    
    return NextResponse.json(
      {
        success: true,
        message: 'Session cleared',
        sessionId,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('[API /ai-agent/history] Delete error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
