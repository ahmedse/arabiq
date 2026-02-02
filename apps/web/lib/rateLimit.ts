/**
 * In-memory rate limiting for API routes
 * For production with multiple instances, use Redis or similar distributed store
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP + route)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // If no record or window expired, start fresh
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  // Check if limit exceeded
  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
}

/**
 * Get client IP from request headers
 * Handles common proxy headers
 */
export function getClientIP(headers: Headers): string {
  // Try various headers for real IP (behind proxies)
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'anonymous';
}

/**
 * Create a rate limit response
 */
export function rateLimitResponse(resetTime: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return Response.json(
    { 
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
      retryAfter 
    },
    { 
      status: 429, 
      headers: { 
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetTime)
      } 
    }
  );
}

// Rate limit configurations for different routes
export const RATE_LIMITS = {
  contact: { limit: 5, windowMs: 60 * 1000 },           // 5 per minute
  login: { limit: 5, windowMs: 60 * 1000 },             // 5 per minute
  register: { limit: 3, windowMs: 60 * 1000 },          // 3 per minute
  forgotPassword: { limit: 3, windowMs: 5 * 60 * 1000 }, // 3 per 5 minutes
  accountUpdate: { limit: 10, windowMs: 60 * 1000 },    // 10 per minute
  passwordChange: { limit: 3, windowMs: 60 * 1000 },    // 3 per minute
} as const;

// Cleanup old entries periodically (runs every minute)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}
