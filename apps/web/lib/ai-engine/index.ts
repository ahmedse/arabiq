/**
 * @fileoverview AI Agent Engine - Main Export
 * 
 * Clean barrel export for the AI Agent Engine.
 */

// Main processing function
export { processMessage, getAgentHealth } from './agent-core';

// Type exports
export type {
  AgentRequest,
  AgentResponse,
  AgentAction,
  AgentContext,
  AgentConfig,
  SessionMemory,
  ConversationMessage,
  IntentResult,
  UsageRecord,
  RateLimitResult,
} from './types';

// Utility exports for advanced usage
export { classifyIntent, getIntentDisplayName } from './intent-classifier';
export { getUsageStats, getGlobalUsageStats, getAllDemoUsage } from './usage-tracker';
export { getSession, getConversationHistory, isSessionValid } from './memory-manager';
export { loadDemoFromCMS, invalidateCache, getCacheStats } from './strapi-loader';

// Tool system exports
export {
  getAvailableTools,
  executeTool,
  executeToolForIntent,
  buildToolDescriptions,
} from './tool-executor';
