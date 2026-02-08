/**
 * @fileoverview Usage Tracker & Rate Limiter
 * 
 * Tracks API usage and enforces rate limits at multiple layers:
 * - IP-based (30 req/min)
 * - Session-based (50 msg/hour)
 * - Demo-based (configurable daily limit)
 * - Global (10,000 msg/day)
 */

import type { RateLimitResult, UsageRecord } from './types';

// ========================================
// Configuration
// ========================================

const RATE_LIMITS = {
  ip: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  session: {
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  demo: {
    maxRequests: 200, // Default per demo
    windowMs: 24 * 60 * 60 * 1000, // 1 day
  },
  global: {
    maxRequests: 10000,
    windowMs: 24 * 60 * 60 * 1000, // 1 day
  },
};

// ========================================
// Storage
// ========================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, RateLimitEntry>();
const sessionLimits = new Map<string, RateLimitEntry>();
const demoLimits = new Map<string, RateLimitEntry>();
let globalLimit: RateLimitEntry = {
  count: 0,
  resetAt: Date.now() + RATE_LIMITS.global.windowMs,
};

// Usage tracking (by demo, by date)
const usageRecords = new Map<string, UsageRecord>();

// Cleanup interval
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    cleanupExpiredEntries();
  }, 5 * 60 * 1000); // Every 5 minutes
}

startCleanup();

// ========================================
// Rate Limiting Functions
// ========================================

/**
 * Check all rate limits for a request
 */
export function checkRateLimit(
  ip: string,
  sessionId: string,
  demoSlug: string,
  demoLimit?: number
): RateLimitResult {
  const now = Date.now();
  
  // Check IP limit
  const ipCheck = checkLimit(ipLimits, ip, RATE_LIMITS.ip, now);
  if (!ipCheck.allowed) {
    return {
      ...ipCheck,
      limitType: 'ip',
      reason: 'Too many requests from your IP address',
    };
  }
  
  // Check session limit
  const sessionCheck = checkLimit(sessionLimits, sessionId, RATE_LIMITS.session, now);
  if (!sessionCheck.allowed) {
    return {
      ...sessionCheck,
      limitType: 'session',
      reason: 'Too many messages in this session',
    };
  }
  
  // Check demo limit
  const demoLimitConfig = {
    maxRequests: demoLimit || RATE_LIMITS.demo.maxRequests,
    windowMs: RATE_LIMITS.demo.windowMs,
  };
  const demoCheck = checkLimit(demoLimits, demoSlug, demoLimitConfig, now);
  if (!demoCheck.allowed) {
    return {
      ...demoCheck,
      limitType: 'demo',
      reason: 'Daily message limit reached for this demo',
    };
  }
  
  // Check global limit
  if (globalLimit.resetAt < now) {
    globalLimit = {
      count: 0,
      resetAt: now + RATE_LIMITS.global.windowMs,
    };
  }
  
  if (globalLimit.count >= RATE_LIMITS.global.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(globalLimit.resetAt).toISOString(),
      limitType: 'global',
      reason: 'Global daily limit reached',
    };
  }
  
  // All checks passed - increment counters
  incrementLimit(ipLimits, ip, RATE_LIMITS.ip, now);
  incrementLimit(sessionLimits, sessionId, RATE_LIMITS.session, now);
  incrementLimit(demoLimits, demoSlug, demoLimitConfig, now);
  globalLimit.count++;
  
  return {
    allowed: true,
    remaining: Math.min(
      ipCheck.remaining - 1,
      sessionCheck.remaining - 1,
      demoCheck.remaining - 1,
      RATE_LIMITS.global.maxRequests - globalLimit.count
    ),
    resetAt: new Date(Math.min(
      ipCheck.resetAt ? new Date(ipCheck.resetAt).getTime() : Infinity,
      sessionCheck.resetAt ? new Date(sessionCheck.resetAt).getTime() : Infinity,
      demoCheck.resetAt ? new Date(demoCheck.resetAt).getTime() : Infinity,
      globalLimit.resetAt
    )).toISOString(),
  };
}

/**
 * Check a single rate limit
 */
function checkLimit(
  storage: Map<string, RateLimitEntry>,
  key: string,
  config: { maxRequests: number; windowMs: number },
  now: number
): RateLimitResult {
  const entry = storage.get(key);
  
  if (!entry || entry.resetAt < now) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now + config.windowMs).toISOString(),
    };
  }
  
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt).toISOString(),
    };
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: new Date(entry.resetAt).toISOString(),
  };
}

/**
 * Increment a rate limit counter
 */
function incrementLimit(
  storage: Map<string, RateLimitEntry>,
  key: string,
  config: { maxRequests: number; windowMs: number },
  now: number
): void {
  const entry = storage.get(key);
  
  if (!entry || entry.resetAt < now) {
    storage.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
  } else {
    entry.count++;
    storage.set(key, entry);
  }
}

// ========================================
// Usage Tracking Functions
// ========================================

/**
 * Track message usage
 */
export function trackUsage(
  demoSlug: string,
  modelUsed: string,
  tokensEstimate: number = 0
): void {
  const date = getCurrentDate();
  const key = `${demoSlug}:${date}`;
  
  const existing = usageRecords.get(key);
  
  if (existing) {
    existing.messageCount++;
    existing.modelCalls[modelUsed] = (existing.modelCalls[modelUsed] || 0) + 1;
    existing.tokensEstimate += tokensEstimate;
  } else {
    usageRecords.set(key, {
      demoSlug,
      date,
      messageCount: 1,
      modelCalls: { [modelUsed]: 1 },
      tokensEstimate,
    });
  }
}

/**
 * Get usage statistics for a demo
 */
export function getUsageStats(demoSlug: string, date?: string): UsageRecord {
  const targetDate = date || getCurrentDate();
  const key = `${demoSlug}:${targetDate}`;
  
  const record = usageRecords.get(key);
  
  if (record) {
    return record;
  }
  
  // Return empty record
  return {
    demoSlug,
    date: targetDate,
    messageCount: 0,
    modelCalls: {},
    tokensEstimate: 0,
  };
}

/**
 * Get all usage records for a demo (all dates)
 */
export function getAllDemoUsage(demoSlug: string): UsageRecord[] {
  const records: UsageRecord[] = [];
  
  for (const [key, record] of usageRecords.entries()) {
    if (key.startsWith(`${demoSlug}:`)) {
      records.push(record);
    }
  }
  
  return records.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get global usage statistics
 */
export function getGlobalUsageStats(date?: string): {
  date: string;
  totalMessages: number;
  totalDemos: number;
  modelBreakdown: Record<string, number>;
  tokensEstimate: number;
} {
  const targetDate = date || getCurrentDate();
  
  let totalMessages = 0;
  const demos = new Set<string>();
  const modelBreakdown: Record<string, number> = {};
  let tokensEstimate = 0;
  
  for (const [key, record] of usageRecords.entries()) {
    if (key.endsWith(`:${targetDate}`)) {
      totalMessages += record.messageCount;
      demos.add(record.demoSlug);
      tokensEstimate += record.tokensEstimate;
      
      for (const [model, count] of Object.entries(record.modelCalls)) {
        modelBreakdown[model] = (modelBreakdown[model] || 0) + count;
      }
    }
  }
  
  return {
    date: targetDate,
    totalMessages,
    totalDemos: demos.size,
    modelBreakdown,
    tokensEstimate,
  };
}

// ========================================
// Utility Functions
// ========================================

/**
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;
  
  // Clean IP limits
  for (const [key, entry] of ipLimits.entries()) {
    if (entry.resetAt < now) {
      ipLimits.delete(key);
      cleaned++;
    }
  }
  
  // Clean session limits
  for (const [key, entry] of sessionLimits.entries()) {
    if (entry.resetAt < now) {
      sessionLimits.delete(key);
      cleaned++;
    }
  }
  
  // Clean demo limits
  for (const [key, entry] of demoLimits.entries()) {
    if (entry.resetAt < now) {
      demoLimits.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Usage Tracker] Cleaned ${cleaned} expired rate limit entries`);
  }
}

/**
 * Reset all rate limits (for testing)
 */
export function resetRateLimits(): void {
  ipLimits.clear();
  sessionLimits.clear();
  demoLimits.clear();
  globalLimit = {
    count: 0,
    resetAt: Date.now() + RATE_LIMITS.global.windowMs,
  };
  console.log('[Usage Tracker] All rate limits reset');
}

/**
 * Clear all usage records (for testing)
 */
export function clearUsageRecords(): void {
  usageRecords.clear();
  console.log('[Usage Tracker] All usage records cleared');
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  ipEntries: number;
  sessionEntries: number;
  demoEntries: number;
  globalCount: number;
} {
  return {
    ipEntries: ipLimits.size,
    sessionEntries: sessionLimits.size,
    demoEntries: demoLimits.size,
    globalCount: globalLimit.count,
  };
}

// ========================================
// Export for testing
// ========================================

export const __testing = {
  startCleanup,
  stopCleanup: () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  },
  cleanupExpiredEntries,
  getLimits: () => ({
    ip: ipLimits,
    session: sessionLimits,
    demo: demoLimits,
    global: globalLimit,
  }),
  getUsageRecords: () => usageRecords,
};
