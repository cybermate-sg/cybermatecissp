/**
 * Database Monitoring and Diagnostics
 * Tools to identify and investigate connection timeout issues
 */

import { db } from './index';
import { sql } from 'drizzle-orm';

export interface QueryMetrics {
  queryName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  retryCount?: number;
  connectionTime?: number;
}

export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  timestamp: number;
}

// In-memory store for recent metrics (last 100 queries)
const queryMetricsStore: QueryMetrics[] = [];
const MAX_METRICS_STORE_SIZE = 100;

/**
 * Log query performance metrics
 */
export function logQueryMetrics(metrics: QueryMetrics) {
  queryMetricsStore.push(metrics);

  // Keep only last 100 entries
  if (queryMetricsStore.length > MAX_METRICS_STORE_SIZE) {
    queryMetricsStore.shift();
  }

  // Log slow queries (> 5 seconds)
  if (metrics.duration && metrics.duration > 5000) {
    console.warn('[DB Monitor] Slow query detected:', {
      query: metrics.queryName,
      duration: `${metrics.duration}ms`,
      success: metrics.success,
      retryCount: metrics.retryCount || 0,
    });
  }

  // Log failed queries
  if (!metrics.success) {
    console.error('[DB Monitor] Query failed:', {
      query: metrics.queryName,
      duration: metrics.duration ? `${metrics.duration}ms` : 'N/A',
      error: metrics.error,
      retryCount: metrics.retryCount || 0,
    });
  }
}

/**
 * Get recent query metrics for analysis
 */
export function getQueryMetrics(): QueryMetrics[] {
  return [...queryMetricsStore];
}

/**
 * Get query statistics summary
 */
export function getQueryStatistics() {
  const total = queryMetricsStore.length;
  const successful = queryMetricsStore.filter(m => m.success).length;
  const failed = queryMetricsStore.filter(m => !m.success).length;
  const durations = queryMetricsStore
    .filter(m => m.duration !== undefined)
    .map(m => m.duration!);

  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
  const minDuration = durations.length > 0 ? Math.min(...durations) : 0;

  const slowQueries = queryMetricsStore.filter(
    m => m.duration && m.duration > 5000
  ).length;

  const queriesWithRetries = queryMetricsStore.filter(
    m => m.retryCount && m.retryCount > 0
  ).length;

  return {
    total,
    successful,
    failed,
    failureRate: total > 0 ? ((failed / total) * 100).toFixed(2) + '%' : '0%',
    avgDuration: avgDuration.toFixed(2) + 'ms',
    maxDuration: maxDuration.toFixed(2) + 'ms',
    minDuration: minDuration.toFixed(2) + 'ms',
    slowQueries,
    queriesWithRetries,
  };
}

/**
 * Wrapper to track query performance
 */
export async function monitoredQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const metrics: QueryMetrics = {
    queryName,
    startTime: Date.now(),
    success: false,
  };

  try {
    const result = await queryFn();
    metrics.success = true;
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    logQueryMetrics(metrics);
    return result;
  } catch (error) {
    const err = error as Error;
    metrics.success = false;
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.error = err?.message || 'Unknown error';
    logQueryMetrics(metrics);
    throw error;
  }
}

/**
 * Wrapper to track query performance with retries
 */
export async function monitoredQueryWithRetry<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  const metrics: QueryMetrics = {
    queryName,
    startTime: Date.now(),
    success: false,
    retryCount: 0,
  };

  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      metrics.success = true;
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.retryCount = attempt - 1;
      logQueryMetrics(metrics);
      return result;
    } catch (error) {
      lastError = error;
      const err = error as Error & { code?: string };

      // Check if error is retryable
      const isRetryable =
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ENOTFOUND' ||
        err?.message?.includes('CONNECT_TIMEOUT') ||
        err?.message?.includes('Connection terminated') ||
        err?.message?.includes('Connection closed');

      if (!isRetryable || attempt === maxRetries) {
        metrics.success = false;
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.error = err?.message || 'Unknown error';
        metrics.retryCount = attempt - 1;
        logQueryMetrics(metrics);
        throw error;
      }

      // Exponential backoff
      const delay = delayMs * attempt;
      console.warn(
        '[DB Monitor] Retry',
        `${attempt}/${maxRetries}`,
        'for',
        queryName,
        'after',
        `${delay}ms`,
        { error: err.message }
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check database connectivity and performance
 */
export async function checkDatabaseHealth() {
  const startTime = Date.now();
  const health = {
    connected: false,
    responseTime: 0,
    error: null as string | null,
    timestamp: new Date().toISOString(),
  };

  try {
    // Simple connectivity check
    await db.execute(sql`SELECT 1 as health_check`);
    health.connected = true;
    health.responseTime = Date.now() - startTime;
  } catch (error) {
    const err = error as Error;
    health.connected = false;
    health.error = err?.message || 'Unknown error';
    health.responseTime = Date.now() - startTime;
  }

  return health;
}

/**
 * Get detailed database diagnostics
 */
export async function getDatabaseDiagnostics() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    health: await checkDatabaseHealth(),
    queryStats: getQueryStatistics(),
    recentFailures: queryMetricsStore
      .filter(m => !m.success)
      .slice(-10)
      .map(m => ({
        query: m.queryName,
        duration: m.duration ? `${m.duration}ms` : 'N/A',
        error: m.error,
        retries: m.retryCount || 0,
        timestamp: new Date(m.startTime).toISOString(),
      })),
    slowQueries: queryMetricsStore
      .filter(m => m.duration && m.duration > 5000)
      .slice(-10)
      .map(m => ({
        query: m.queryName,
        duration: `${m.duration}ms`,
        retries: m.retryCount || 0,
        timestamp: new Date(m.startTime).toISOString(),
      })),
  };

  // Try to get database statistics if available
  try {
    const [stats] = await db.execute(sql`
      SELECT
        current_database() as database,
        pg_database_size(current_database()) as size_bytes,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections
    `);
    diagnostics.postgresStats = stats;
  } catch (error) {
    const err = error as Error;
    diagnostics.postgresStatsError = err?.message;
  }

  return diagnostics;
}

/**
 * Clear metrics store (useful for testing)
 */
export function clearMetrics() {
  queryMetricsStore.length = 0;
}
