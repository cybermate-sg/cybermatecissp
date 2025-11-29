import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';
import { collectAppMetrics, metricsCollector } from '@/lib/metrics/prometheus';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * Prometheus Metrics Endpoint
 * GET /api/metrics
 *
 * Returns metrics in Prometheus text format for scraping
 */
async function getMetrics(_request: NextRequest) {
  void _request;
  // Collect current metrics
  collectAppMetrics(cache);

  // Export in Prometheus format
  const prometheusText = metricsCollector.export();

  return new Response(prometheusText, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export const GET = withTracing(
  withErrorHandling(getMetrics as unknown as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'get prometheus metrics'),
  { logRequest: false, logResponse: false }
);

/**
 * Get metrics as JSON
 * GET /api/metrics?format=json
 */
async function postMetrics(_request: NextRequest) {
  void _request;
  // Collect current metrics
  collectAppMetrics(cache);

  // Return as JSON
  const metrics = metricsCollector.toJSON();

  return NextResponse.json({
    metrics,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export const POST = withTracing(
  withErrorHandling(postMetrics, 'get prometheus metrics as json'),
  { logRequest: false, logResponse: false }
);
