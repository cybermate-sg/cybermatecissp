/**
 * API Performance Timing Middleware
 * Tracks response times for API endpoints
 */

export interface TimingMetrics {
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  dbQueryTime?: number;
  cacheTime?: number;
  statusCode?: number;
  requestId?: string;
}

class PerformanceTimer {
  private startTime: number;
  private metrics: Partial<TimingMetrics>;

  constructor(endpoint: string, method: string, requestId?: string) {
    this.startTime = performance.now();
    this.metrics = {
      endpoint,
      method,
      startTime: this.startTime,
      requestId,
    };
  }

  /**
   * Mark the start of a database query
   */
  startDbQuery(): () => void {
    const queryStart = performance.now();
    return () => {
      const queryEnd = performance.now();
      const queryDuration = queryEnd - queryStart;
      this.metrics.dbQueryTime = (this.metrics.dbQueryTime || 0) + queryDuration;
    };
  }

  /**
   * Mark the start of a cache operation
   */
  startCacheOp(): () => void {
    const cacheStart = performance.now();
    return () => {
      const cacheEnd = performance.now();
      const cacheDuration = cacheEnd - cacheStart;
      this.metrics.cacheTime = (this.metrics.cacheTime || 0) + cacheDuration;
    };
  }

  /**
   * End timing and return metrics
   */
  end(statusCode: number): TimingMetrics {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    this.metrics.endTime = endTime;
    this.metrics.duration = duration;
    this.metrics.statusCode = statusCode;

    return this.metrics as TimingMetrics;
  }

  /**
   * Get current metrics without ending
   */
  getMetrics(): Partial<TimingMetrics> {
    return { ...this.metrics };
  }
}

/**
 * Format timing metrics for logging
 */
export function formatTimingLog(metrics: TimingMetrics): string {
  const { requestId, method, endpoint, duration, dbQueryTime, cacheTime, statusCode } = metrics;

  const parts = [
    `[API Timing]`,
    requestId ? `[${requestId}]` : '',
    `${method} ${endpoint}`,
    `${duration?.toFixed(2)}ms`,
    statusCode ? `[${statusCode}]` : '',
  ];

  if (dbQueryTime) {
    parts.push(`DB: ${dbQueryTime.toFixed(2)}ms`);
  }

  if (cacheTime) {
    parts.push(`Cache: ${cacheTime.toFixed(2)}ms`);
  }

  return parts.filter(Boolean).join(' | ');
}

/**
 * Determine performance rating based on duration
 */
export function getPerformanceRating(duration: number): 'Good' | 'Needs Improvement' | 'Poor' {
  if (duration < 100) return 'Good';
  if (duration < 500) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Create a new performance timer for an API endpoint
 */
export function createApiTimer(endpoint: string, method: string, requestId?: string): PerformanceTimer {
  return new PerformanceTimer(endpoint, method, requestId);
}

/**
 * Wrapper for timing async operations
 */
export async function timeAsync<T>(
  timer: PerformanceTimer,
  operation: () => Promise<T>,
  type: 'db' | 'cache'
): Promise<T> {
  const endTimer = type === 'db' ? timer.startDbQuery() : timer.startCacheOp();
  try {
    const result = await operation();
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    throw error;
  }
}

/**
 * Add timing headers to response
 */
export function addTimingHeaders(response: Response, metrics: TimingMetrics): Response {
  const headers = new Headers(response.headers);

  // Add Server-Timing header for browser DevTools
  const timings: string[] = [];

  if (metrics.duration) {
    timings.push(`total;dur=${metrics.duration.toFixed(2)}`);
  }

  if (metrics.dbQueryTime) {
    timings.push(`db;dur=${metrics.dbQueryTime.toFixed(2)}`);
  }

  if (metrics.cacheTime) {
    timings.push(`cache;dur=${metrics.cacheTime.toFixed(2)}`);
  }

  if (timings.length > 0) {
    headers.set('Server-Timing', timings.join(', '));
  }

  // Add custom headers
  if (metrics.duration) {
    headers.set('X-Response-Time', `${metrics.duration.toFixed(2)}ms`);
    headers.set('X-Performance-Rating', getPerformanceRating(metrics.duration));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Helper to wrap API route handlers with timing
 */
export function withTiming<T extends (...args: never[]) => Promise<Response>>(
  handler: T,
  endpoint: string
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    const method = request.method;

    const timer = createApiTimer(endpoint, method);

    try {
      const response = await handler(...args);
      const metrics = timer.end(response.status);

      // Log metrics
      console.log(formatTimingLog(metrics));

      // Add timing headers to response
      return addTimingHeaders(response, metrics);
    } catch (error) {
      const metrics = timer.end(500);
      console.error(formatTimingLog(metrics), error);
      throw error;
    }
  }) as T;
}
