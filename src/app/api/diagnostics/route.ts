import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Database Diagnostics Endpoint
 * GET /api/diagnostics
 *
 * Provides detailed database diagnostics including:
 * - Connection pool status
 * - Active connections
 * - Database performance metrics
 * - Recent query statistics
 * - Environment configuration
 *
 * This endpoint should be protected in production!
 */
export async function GET(request: Request) {
  const startTime = performance.now();

  // Basic auth check - only allow in development or with proper auth
  const authHeader = request.headers.get('authorization');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const diagnosticsKey = process.env.DIAGNOSTICS_KEY;

  if (!isDevelopment && diagnosticsKey) {
    const expectedAuth = `Bearer ${diagnosticsKey}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    responseTime: 0,
  };

  // Database connection test
  try {
    const dbStart = performance.now();
    await db.execute(sql`SELECT 1 as health_check`);
    const dbEnd = performance.now();

    diagnostics.database = {
      connected: true,
      responseTime: Math.round((dbEnd - dbStart) * 100) / 100,
    };
  } catch (error: any) {
    diagnostics.database = {
      connected: false,
      error: error?.message,
      errorCode: error?.code,
    };
  }

  // Get PostgreSQL statistics
  try {
    const [stats] = await db.execute(sql`
      SELECT
        current_database() as database,
        pg_database_size(current_database()) as size_bytes,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as total_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction') as idle_in_transaction,
        (SELECT max(now() - query_start) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as longest_query_duration
    `);
    diagnostics.postgresStats = stats;
  } catch (error: any) {
    diagnostics.postgresStatsError = error?.message;
  }

  // Get connection configuration
  diagnostics.connectionConfig = {
    databaseUrl: process.env.DATABASE_URL ? '***configured***' : 'NOT SET',
    postgresUrl: process.env.POSTGRES_URL ? '***configured***' : 'NOT SET',
    // These are from the connection config in src/lib/db/index.ts
    maxPoolSize: 5,
    idleTimeout: 20,
    maxLifetime: 300, // 5 minutes
    connectTimeout: 30,
    queryTimeout: 25,
  };

  // Get slow query log (if available)
  try {
    const slowQueries = await db.execute(sql`
      SELECT
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);
    diagnostics.slowQueries = slowQueries;
  } catch (error: any) {
    // pg_stat_statements might not be available
    diagnostics.slowQueriesNote = 'pg_stat_statements extension not available';
  }

  // Get current activity
  try {
    const activity = await db.execute(sql`
      SELECT
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        wait_event_type,
        wait_event,
        LEFT(query, 100) as query_preview
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
      ORDER BY query_start DESC
      LIMIT 20
    `);
    diagnostics.recentActivity = activity;
  } catch (error: any) {
    diagnostics.recentActivityError = error?.message;
  }

  // Check for lock waits
  try {
    const locks = await db.execute(sql`
      SELECT
        blocked_locks.pid AS blocked_pid,
        blocking_locks.pid AS blocking_pid,
        blocked_activity.usename AS blocked_user,
        blocking_activity.usename AS blocking_user,
        blocked_activity.query AS blocked_query,
        blocking_activity.query AS blocking_query
      FROM pg_catalog.pg_locks blocked_locks
      JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
      JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
        AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
        AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
        AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
        AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
        AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
        AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
        AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
      WHERE NOT blocked_locks.granted
      LIMIT 10
    `);
    diagnostics.lockWaits = locks;
  } catch (error: any) {
    diagnostics.lockWaitsError = error?.message;
  }

  const endTime = performance.now();
  diagnostics.responseTime = Math.round((endTime - startTime) * 100) / 100;

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${diagnostics.responseTime}ms`,
    },
  });
}
