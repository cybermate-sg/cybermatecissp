/**
 * Higher-order function to wrap API routes with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, getRateLimitHeaders, RateLimitConfig } from '@/lib/rate-limit';

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getIdentifier(request: NextRequest, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Wrap an API route handler with rate limiting
 */
type RouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response>;

export function withRateLimit<T extends RouteHandler>(
  handler: T,
  config: RateLimitConfig & { getUserId?: (request: NextRequest) => Promise<string | undefined> }
): T {
  return (async (request: NextRequest, ...args: unknown[]) => {
    try {
      // Get user ID if auth function provided
      const userId = config.getUserId ? await config.getUserId(request) : undefined;

      // Get identifier for rate limiting
      const identifier = getIdentifier(request, userId);

      // Check rate limit
      const { allowed, result } = await applyRateLimit(identifier, config);

      // Add rate limit headers to response
      const headers = getRateLimitHeaders(result);

      // If rate limited, return 429
      if (!allowed) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers,
          }
        );
      }

      // Call the original handler
      const response = await handler(request, ...args);

      // Add rate limit headers to successful response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // On error, pass through to handler (fail open)
      return handler(request, ...args);
    }
  }) as T;
}
