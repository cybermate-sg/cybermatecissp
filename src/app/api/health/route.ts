import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { sql } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Checks the health of critical services:
 * - Database connection
 * - Redis cache connection
 * - Overall API availability
 *
 * Returns:
 * - 200: All services healthy
 * - 503: One or more services unhealthy
 */
async function getHealth(_request: NextRequest) {
  const startTime = performance.now();

  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: 'unknown' as 'healthy' | 'unhealthy',
        responseTime: 0,
        error: null as string | null,
      },
      cache: {
        status: 'unknown' as 'healthy' | 'unhealthy',
        responseTime: 0,
        error: null as string | null,
      },
    },
    uptime: process.uptime(),
    totalResponseTime: 0,
  };

  // Check Database
  try {
    const dbStart = performance.now();
    await db.execute(sql`SELECT 1 as health_check`);
    const dbEnd = performance.now();

    health.services.database.status = 'healthy';
    health.services.database.responseTime = Math.round((dbEnd - dbStart) * 100) / 100;
  } catch (error) {
    health.services.database.status = 'unhealthy';
    health.services.database.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'unhealthy';
  }

  // Check Redis Cache
  try {
    const cacheStart = performance.now();
    const testKey = '__health_check__';
    const testValue = { ping: 'pong', timestamp: Date.now() };

    // Try to set and get a value
    await cache.set(testKey, testValue, { ttl: 10 });

    // Small delay to ensure write completes
    await new Promise(resolve => setTimeout(resolve, 100));

    const retrieved = await cache.get<typeof testValue>(testKey);
    await cache.del(testKey);

    const cacheEnd = performance.now();

    // Compare JSON strings for accurate comparison
    if (retrieved && JSON.stringify(retrieved) === JSON.stringify(testValue)) {
      health.services.cache.status = 'healthy';
      health.services.cache.responseTime = Math.round((cacheEnd - cacheStart) * 100) / 100;
    } else {
      health.services.cache.status = 'unhealthy';
      health.services.cache.error = `Cache write/read mismatch: expected ${JSON.stringify(testValue)}, got ${JSON.stringify(retrieved)}`;
      // Don't mark overall as unhealthy since cache is optional
      if (health.status === 'healthy') {
        health.status = 'degraded';
      }
    }
  } catch (error) {
    health.services.cache.status = 'unhealthy';
    health.services.cache.error = error instanceof Error ? error.message : 'Unknown error';
    // Cache failure is degraded, not unhealthy (since we have graceful fallback)
    if (health.status === 'healthy') {
      health.status = 'degraded';
    }
  }

  const endTime = performance.now();
  health.totalResponseTime = Math.round((endTime - startTime) * 100) / 100;

  // Determine HTTP status code
  const statusCode = health.status === 'unhealthy' ? 503 : 200;

  // Log health check result
  const logLevel = health.status === 'healthy' ? 'log' : 'warn';
  console[logLevel](`[Health Check] Status: ${health.status}`, {
    db: health.services.database.status,
    cache: health.services.cache.status,
    responseTime: `${health.totalResponseTime}ms`,
  });

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${health.totalResponseTime}ms`,
    },
  });
}

export const GET = withTracing(
  withErrorHandling(getHealth, 'health check'),
  { logRequest: false, logResponse: false }
);
