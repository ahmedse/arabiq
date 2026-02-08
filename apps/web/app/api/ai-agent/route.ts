/**
 * @fileoverview AI Agent API Route
 * 
 * Main API endpoint for the AI Agent Engine.
 * Handles message processing and health checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processMessage, getAgentHealth } from '@/lib/ai-engine';
import type { AgentRequest } from '@/lib/ai-engine';

/**
 * POST /api/ai-agent
 * Process a message through the AI agent
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Extract IP from headers (for rate limiting)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Extract user ID from auth (if available)
    // TODO: Extract from session/JWT when auth is implemented
    const userId = body.userId || undefined;
    
    // Build agent request
    const agentRequest: AgentRequest = {
      message: body.message,
      demoSlug: body.demoSlug,
      sessionId: body.sessionId,
      locale: body.locale || 'en',
      currentLocation: body.currentLocation,
      currentItem: body.currentItem,
      userId: userId || ip, // Use IP as fallback for rate limiting
    };
    
    // Validate required fields
    if (!agentRequest.message || agentRequest.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    if (!agentRequest.demoSlug) {
      return NextResponse.json(
        { error: 'Demo slug is required' },
        { status: 400 }
      );
    }
    
    // Process message
    const response = await processMessage(agentRequest);
    
    // Return response
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('[API /ai-agent] Error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai-agent
 * Health check endpoint
 */
export async function GET() {
  try {
    const health = getAgentHealth();
    
    return NextResponse.json(health, {
      status: health.status === 'ok' ? 200 : 503,
    });
  } catch (error) {
    console.error('[API /ai-agent] Health check error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        engine: 'ai-agent-v1',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
