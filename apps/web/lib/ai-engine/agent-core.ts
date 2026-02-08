/**
 * @fileoverview Agent Core Orchestrator
 * 
 * Main entry point for the AI Agent Engine.
 * Orchestrates the complete reasoning loop from request to response.
 */

import type { AgentRequest, AgentResponse, ConversationMessage, DemoConfig, TourItem, IntentType } from './types';
import { classifyIntent } from './intent-classifier';
import { routeToModel, callModel, generateLocalResponse, isPoeApiAvailable } from './model-router';
import { getOrCreateSession, updateSession, getConversationHistory } from './memory-manager';
import { checkRateLimit, trackUsage, getUsageStats } from './usage-tracker';
import { buildContext, getDefaultConfig } from './context-builder';
import { formatResponse, formatErrorResponse, formatRateLimitResponse, validateResponse } from './response-formatter';
import { randomUUID } from 'crypto';
import { loadDemoFromCMS, loadAgentConfig, loadKnowledgeEntries, getCacheStats as getStrapiCacheStats } from './strapi-loader';
import { executeToolForIntent } from './tool-executor';

// ========================================
// Main Processing Function
// ========================================

/**
 * Process incoming message through the AI agent engine
 */
export async function processMessage(request: AgentRequest): Promise<AgentResponse> {
  const startTime = Date.now();
  
  try {
    // 1. Validate input
    if (!request.message || request.message.trim().length === 0) {
      throw new Error('Message is required');
    }
    
    if (!request.demoSlug) {
      throw new Error('Demo slug is required');
    }
    
    const locale = request.locale || 'en';
    const message = request.message.trim();
    
    // Generate or use provided session ID
    const sessionId = request.sessionId || `session_${randomUUID()}`;
    
    // 2. Check rate limits
    const rateLimitCheck = checkRateLimit(
      request.userId || 'anonymous', // Use userId as IP proxy for now
      sessionId,
      request.demoSlug
    );
    
    if (!rateLimitCheck.allowed) {
      console.log('[Agent Core] Rate limit exceeded:', rateLimitCheck);
      return formatRateLimitResponse(
        rateLimitCheck.remaining,
        rateLimitCheck.resetAt,
        locale,
        sessionId
      );
    }
    
    // 3. Load or create session
    const session = getOrCreateSession(
      sessionId,
      request.demoSlug,
      locale,
      request.userId
    );
    
    // 4. Classify intent (fast local — used for routing decisions + offline fallback)
    console.log('[Agent Core] Classifying intent for message:', message);
    const intent = await classifyIntent(message, locale, false); // Local only — LLM handles understanding
    console.log('[Agent Core] Intent detected:', intent);
    
    // 5. Load demo data and items
    const { demo, items } = await loadDemoData(request.demoSlug);
    
    // 5.5. Load AI agent config and knowledge base from CMS
    console.log('[Agent Core] Loading AI config and knowledge from CMS...');
    const cmsConfig = await loadAgentConfig(request.demoSlug, locale);
    const knowledgeEntries = await loadKnowledgeEntries(request.demoSlug, locale);
    
    if (cmsConfig) {
      console.log('[Agent Core] Using CMS agent config');
      demo.agentConfig = cmsConfig;
    }
    
    console.log(`[Agent Core] Loaded ${knowledgeEntries.length} knowledge entries`);
    
    // 6. Build agent config
    const config = demo.agentConfig || getDefaultConfig(demo);
    
    // 7. Get usage stats for budget checking
    const usageStats = getUsageStats(request.demoSlug);
    
    // 8. Route to appropriate model tier
    const route = routeToModel(intent.intent as IntentType, config, usageStats);
    console.log('[Agent Core] Routing to:', route);
    
    // ========================================
    // LLM-FIRST ARCHITECTURE
    // When LLM is available, let it handle understanding.
    // Tools are the OFFLINE FALLBACK, not the primary path.
    // ========================================
    
    let rawResponse: string;
    let actualModel = route.model;
    let actualTier = route.tier;
    
    // Simple intents that don't need LLM (greeting, farewell, help, confirmation, out_of_scope)
    const simpleIntents: IntentType[] = ['greeting', 'farewell', 'confirmation', 'help', 'out_of_scope'];
    const isSimpleIntent = simpleIntents.includes(intent.intent as IntentType) && intent.confidence >= 0.9;
    
    if (isSimpleIntent) {
      // Fast path: Handle simple intents locally (no API cost)
      rawResponse = generateLocalResponse(intent.intent as IntentType, locale, config, intent.entities);
      actualModel = 'local';
      actualTier = 'local';
      console.log('[Agent Core] Fast path for simple intent:', intent.intent);
      
    } else if (isPoeApiAvailable()) {
      // SMART PATH: Send to LLM with full conversation context + items catalog
      // The LLM handles: typos, follow-ups, context resolution, item references
      console.log('[Agent Core] LLM-first path — sending to model with full context');
      
      try {
        // Add the current user message to session BEFORE building context
        // so the LLM sees it in the conversation flow
        const userMsgForContext: ConversationMessage = {
          role: 'user',
          content: message,
          timestamp: Date.now(),
          intent: intent.intent,
        };
        updateSession(sessionId, userMsgForContext);
        
        const result = await callModelWithContext(
          route.isLocal ? 'Claude-3-Haiku' : route.model, // Never use 'local' as model name
          demo,
          items,
          session,
          intent,
          locale,
          config,
          knowledgeEntries
        );
        
        rawResponse = result.text;
        if (result.wasLocal) {
          // LLM failed, fell back to local — try tools as backup
          const agentContext = { demo, items, locale, session };
          const toolResult = executeToolForIntent(intent.intent as IntentType, agentContext, intent.entities);
          if (toolResult?.success && toolResult.displayText) {
            rawResponse = toolResult.displayText;
            actualModel = 'tool';
          } else {
            actualModel = 'local';
          }
          actualTier = 'local';
        } else {
          actualModel = route.model;
          actualTier = route.tier;
        }
        console.log(`[Agent Core] Response via ${actualModel}`);
        
      } catch (error) {
        // LLM completely failed — fall back to tools
        console.error('[Agent Core] LLM path failed, falling back to tools:', error);
        const agentContext = { demo, items, locale, session };
        const toolResult = executeToolForIntent(intent.intent as IntentType, agentContext, intent.entities);
        if (toolResult?.success && toolResult.displayText) {
          rawResponse = toolResult.displayText;
          actualModel = 'tool';
        } else {
          rawResponse = generateLocalResponse(intent.intent as IntentType, locale, config, intent.entities);
          actualModel = 'local';
        }
        actualTier = 'local';
      }
      
    } else {
      // OFFLINE PATH: No LLM available — use keyword intent + tools (old flow)
      console.log('[Agent Core] Offline path — using tools + templates');
      const agentContext = { demo, items, locale, session };
      const toolResult = executeToolForIntent(intent.intent as IntentType, agentContext, intent.entities);
      
      if (toolResult?.success && toolResult.displayText) {
        rawResponse = toolResult.displayText;
        actualModel = 'tool';
        actualTier = 'local';
      } else {
        rawResponse = generateLocalResponse(intent.intent as IntentType, locale, config, intent.entities);
        actualModel = 'local';
        actualTier = 'local';
      }
    }
    
    // 9. Add user message to session (only if we didn't already add it for LLM context)
    if (!isPoeApiAvailable() || isSimpleIntent) {
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
        intent: intent.intent,
      };
      updateSession(sessionId, userMessage);
    }
    
    // 11. Validate and sanitize response
    const validation = validateResponse(rawResponse, items);
    if (!validation.isValid) {
      console.warn('[Agent Core] Response validation issues:', validation.issues);
    }
    
    // 12. Format response
    const formattedResponse = formatResponse(
      validation.sanitized,
      intent,
      items,
      locale,
      session,
      sessionId,
      actualModel,
      actualTier,
      demo
    );
    
    // 13. Add assistant message to session
    const assistantMessage: ConversationMessage = {
      role: 'assistant',
      content: formattedResponse.message,
      timestamp: Date.now(),
      actions: formattedResponse.actions,
    };
    updateSession(sessionId, assistantMessage);
    
    // 14. Track usage
    trackUsage(request.demoSlug, route.model, route.estimatedCost || 0);
    
    // Log performance
    const duration = Date.now() - startTime;
    console.log(`[Agent Core] Processed in ${duration}ms, tier: ${route.tier}`);
    
    return formattedResponse;
  } catch (error) {
    console.error('[Agent Core] Error processing message:', error);
    
    const sessionId = request.sessionId || `session_${randomUUID()}`;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return formatErrorResponse(errorMessage, request.locale || 'en', sessionId);
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Call model with full context
 */
async function callModelWithContext(
  model: string,
  demo: DemoConfig,
  items: TourItem[],
  session: any,
  intent: any,
  locale: string,
  config: any,
  knowledgeEntries: any[] = []
): Promise<{ text: string; wasLocal: boolean }> {
  // Build context
  const context = buildContext(demo, items, session, intent, locale, knowledgeEntries);
  
  // Call model
  try {
    const response = await callModel(model, context.messages, config);
    return { text: response, wasLocal: false };
  } catch (error) {
    console.error('[Agent Core] Model call failed:', error instanceof Error ? error.message : error);
    
    // Fallback to local response on error
    const local = generateLocalResponse(intent.intent as IntentType, locale, config, intent.entities);
    return { text: local, wasLocal: true };
  }
}

/**
 * Load demo data and items from Strapi CMS
 */
async function loadDemoData(demoSlug: string): Promise<{
  demo: DemoConfig;
  items: TourItem[];
}> {
  return await loadDemoFromCMS(demoSlug);
}

/**
 * Get agent health status
 */
export function getAgentHealth(): {
  status: 'ok' | 'degraded' | 'error';
  engine: string;
  models: {
    poe: boolean;
  };
  cache: {
    entries: number;
    hits: number;
    misses: number;
  };
  uptime: number;
} {
  return {
    status: isPoeApiAvailable() ? 'ok' : 'degraded',
    engine: 'ai-agent-v1',
    models: {
      poe: isPoeApiAvailable(),
    },
    cache: getStrapiCacheStats(),
    uptime: process.uptime(),
  };
}
