/**
 * @fileoverview Memory Manager
 * 
 * In-memory session store with automatic TTL cleanup.
 * Maintains conversation history for continuity across messages.
 */

import type { SessionMemory, ConversationMessage } from './types';

// ========================================
// Configuration
// ========================================

const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 hours
const MAX_MESSAGES_PER_SESSION = 20;
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

// ========================================
// Session Store
// ========================================

const sessions = new Map<string, SessionMemory>();

// Start cleanup interval
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    cleanupExpiredSessions();
  }, CLEANUP_INTERVAL);
}

function stopCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

// Initialize cleanup on module load
startCleanup();

// ========================================
// Session Management
// ========================================

/**
 * Get an existing session or return null
 */
export function getSession(sessionId: string): SessionMemory | null {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  const now = Date.now();
  if (now - session.lastActivity > SESSION_TTL) {
    sessions.delete(sessionId);
    return null;
  }
  
  return session;
}

/**
 * Create a new session
 */
export function createSession(
  sessionId: string,
  demoSlug: string,
  locale: string,
  userId?: string
): SessionMemory {
  const now = Date.now();
  
  const session: SessionMemory = {
    sessionId,
    demoSlug,
    messages: [],
    lastActivity: now,
    locale,
    metadata: {
      userId,
      startedAt: now,
      messageCount: 0,
      leadCaptured: false,
    },
  };
  
  sessions.set(sessionId, session);
  return session;
}

/**
 * Update session with a new message
 */
export function updateSession(
  sessionId: string,
  message: ConversationMessage
): void {
  const session = sessions.get(sessionId);
  
  if (!session) {
    console.warn(`[Memory Manager] Session ${sessionId} not found`);
    return;
  }
  
  // Add message
  session.messages.push(message);
  
  // Trim to max messages (keep most recent)
  if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
    session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
  }
  
  // Update metadata
  session.lastActivity = Date.now();
  if (session.metadata) {
    session.metadata.messageCount++;
  }
  
  sessions.set(sessionId, session);
}

/**
 * Get conversation history
 */
export function getConversationHistory(
  sessionId: string,
  maxMessages?: number
): ConversationMessage[] {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return [];
  }
  
  if (maxMessages && maxMessages < session.messages.length) {
    return session.messages.slice(-maxMessages);
  }
  
  return session.messages;
}

/**
 * Clear a session
 */
export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

/**
 * Update session metadata
 */
export function updateSessionMetadata(
  sessionId: string,
  metadata: Partial<SessionMemory['metadata']>
): void {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return;
  }
  
  session.metadata = {
    ...session.metadata,
    ...metadata,
  } as SessionMemory['metadata'];
  
  sessions.set(sessionId, session);
}

/**
 * Get or create a session
 */
export function getOrCreateSession(
  sessionId: string,
  demoSlug: string,
  locale: string,
  userId?: string
): SessionMemory {
  const existing = getSession(sessionId);
  
  if (existing) {
    // Update activity timestamp
    existing.lastActivity = Date.now();
    sessions.set(sessionId, existing);
    return existing;
  }
  
  return createSession(sessionId, demoSlug, locale, userId);
}

// ========================================
// Cleanup Functions
// ========================================

/**
 * Remove expired sessions
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TTL) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Memory Manager] Cleaned ${cleaned} expired sessions`);
  }
}

/**
 * Get session statistics
 */
export function getSessionStats(): {
  total: number;
  byDemo: Record<string, number>;
  oldestActivity: number | null;
} {
  const stats = {
    total: sessions.size,
    byDemo: {} as Record<string, number>,
    oldestActivity: null as number | null,
  };
  
  for (const session of sessions.values()) {
    // Count by demo
    stats.byDemo[session.demoSlug] = (stats.byDemo[session.demoSlug] || 0) + 1;
    
    // Track oldest
    if (!stats.oldestActivity || session.lastActivity < stats.oldestActivity) {
      stats.oldestActivity = session.lastActivity;
    }
  }
  
  return stats;
}

/**
 * Clear all sessions (for testing/reset)
 */
export function clearAllSessions(): void {
  sessions.clear();
  console.log('[Memory Manager] All sessions cleared');
}

/**
 * Get all sessions for a user (authenticated users only)
 */
export function getUserSessions(userId: string): SessionMemory[] {
  const userSessions: SessionMemory[] = [];
  
  for (const session of sessions.values()) {
    if (session.metadata?.userId === userId) {
      userSessions.push(session);
    }
  }
  
  return userSessions;
}

/**
 * Get all sessions for a demo
 */
export function getDemoSessions(demoSlug: string): SessionMemory[] {
  const demoSessions: SessionMemory[] = [];
  
  for (const session of sessions.values()) {
    if (session.demoSlug === demoSlug) {
      demoSessions.push(session);
    }
  }
  
  return demoSessions;
}

/**
 * Check if session exists and is valid
 */
export function isSessionValid(sessionId: string): boolean {
  const session = sessions.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  const now = Date.now();
  return now - session.lastActivity <= SESSION_TTL;
}

// ========================================
// Export cleanup control for testing
// ========================================

export const __testing = {
  startCleanup,
  stopCleanup,
  cleanupExpiredSessions,
  getSessions: () => sessions,
};
