/**
 * Rate Limiting Utility
 * Implements token bucket algorithm for API rate limiting
 */

import { cache } from './redis';

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
  keyPrefix?: string; // Prefix for cache keys
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the limit resets
  retryAfter?: number; // Seconds to wait before retrying (if rate limited)
}

/**
 * Rate limiter using sliding window algorithm with Redis
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      keyPrefix: config.keyPrefix || 'ratelimit',
    };
  }

  /**
   * Check if request is within rate limit
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Get current request log from cache
      const requestLog = await cache.get<number[]>(key) || [];

      // Filter out requests outside the current window
      const recentRequests = requestLog.filter((timestamp) => timestamp > windowStart);

      // Check if rate limit exceeded
      if (recentRequests.length >= this.config.maxRequests) {
        const oldestRequest = Math.min(...recentRequests);
        const resetTime = oldestRequest + this.config.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          reset: resetTime,
          retryAfter: retryAfter > 0 ? retryAfter : 1,
        };
      }

      // Add current request to log
      recentRequests.push(now);

      // Store updated log with TTL
      const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
      await cache.set(key, recentRequests, { ttl: ttlSeconds });

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - recentRequests.length,
        reset: now + this.config.windowMs,
      };
    } catch (error) {
      console.error('Rate limiter error - failing closed for security:', error);

      // SECURITY: Fail closed - deny the request on error
      // This prevents rate limit bypass if Redis is unavailable
      // Only in development, we can be more lenient
      const shouldFailOpen = process.env.NODE_ENV === 'development';

      if (shouldFailOpen) {
        console.warn('Development mode: allowing request despite rate limiter error');
        return {
          success: true,
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests,
          reset: now + this.config.windowMs,
        };
      }

      // Production: Fail closed (deny request)
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: now + this.config.windowMs,
        retryAfter: 60, // Retry after 1 minute
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string): Promise<boolean> {
    const key = `${this.config.keyPrefix}:${identifier}`;
    return await cache.del(key);
  }
}

/**
 * Middleware helper to apply rate limiting
 */
export async function applyRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  const limiter = new RateLimiter(config);
  const result = await limiter.check(identifier);

  return {
    allowed: result.success,
    result,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  // Standard: 60 requests per minute
  standard: {
    maxRequests: 60,
    windowMs: 60 * 1000,
  },
  // Generous: 100 requests per minute
  generous: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // Auth: 5 attempts per 15 minutes (for login, etc.)
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },
  // API: 1000 requests per hour
  api: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000,
  },
} as const;
