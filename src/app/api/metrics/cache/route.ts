import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * Cache Metrics Endpoint
 * GET /api/metrics/cache
 *
 * Returns cache performance metrics including:
 * - Hit/miss counts and rates
 * - Connection status
 * - Error tracking
 */
async function getCacheMetrics(_request: NextRequest) {
  const metrics = cache.getMetrics();
  const health = await cache.checkHealth();

  return NextResponse.json({
    metrics: {
      ...metrics,
      hitRateFormatted: `${metrics.hitRate.toFixed(2)}%`,
    },
    health: {
      ...health,
      latencyFormatted: `${health.latency.toFixed(2)}ms`,
    },
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export const GET = withTracing(
  withErrorHandling(getCacheMetrics, 'get cache metrics'),
  { logRequest: false, logResponse: false }
);

/**
 * Reset Cache Metrics
 * POST /api/metrics/cache/reset
 */
async function resetCacheMetrics(_request: NextRequest) {
  cache.resetMetrics();

  return NextResponse.json({
    message: 'Cache metrics reset successfully',
    timestamp: new Date().toISOString(),
  });
}

export const POST = withTracing(
  withErrorHandling(resetCacheMetrics, 'reset cache metrics'),
  { logRequest: false, logResponse: false }
);
