# Database Monitoring Setup

This document explains how to use the database monitoring tools to track and diagnose connection issues.

## Overview

The monitoring system provides:
- ✅ Query performance tracking
- ✅ Automatic retry with logging
- ✅ Health check endpoint
- ✅ Detailed diagnostics endpoint
- ✅ Connection pool monitoring

## Quick Start

### 1. Enable Diagnostics Endpoint (Production)

Set an environment variable to protect the diagnostics endpoint:

```bash
# .env.local or your hosting platform
DIAGNOSTICS_KEY=your-secret-key-here
```

### 2. Access Endpoints

#### Health Check (Public)
```bash
curl https://your-app.com/api/health
```

Returns:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 45.2
    }
  },
  "uptime": 3600,
  "totalResponseTime": 123.4
}
```

#### Diagnostics (Protected)
```bash
# Development (no auth required)
curl http://localhost:3000/api/diagnostics

# Production (requires auth)
curl -H "Authorization: Bearer YOUR_KEY" https://your-app.com/api/diagnostics
```

Returns detailed database statistics, connection pool status, active queries, and more.

## Reading the Logs

### Log Format

All database operations now produce structured logs:

#### Successful Query
```
[DB Success] "query-name" completed in 234ms (attempt 1/3, last attempt: 234ms)
```

#### Query Error
```
[DB Error] Attempt 1/3 for "query-name" failed after 15234ms: {
  errorCode: 'ETIMEDOUT',
  errorMessage: 'Connection timeout',
  errorType: 'Error'
}
```

#### Retry Attempt
```
[DB Retry] Retrying "query-name" in 2000ms (attempt 2/3)...
```

#### Permanent Failure
```
[DB Failed] "query-name" failed permanently after 45678ms and 3 attempts: {
  finalError: 'Connection timeout',
  isRetryable: true
}
```

### Log Analysis

#### Find Failed Queries
```bash
# In your logs
grep "\[DB Failed\]" logs.txt

# With query name
grep "\[DB Failed\]" logs.txt | grep "dashboard-fetch-all-classes"
```

#### Find Slow Queries (>5 seconds)
```bash
grep "\[DB Success\]" logs.txt | grep -E "[5-9][0-9]{3}ms|[0-9]{5}ms"
```

#### Count Retries
```bash
grep "\[DB Retry\]" logs.txt | wc -l
```

#### Find Most Common Failures
```bash
grep "\[DB Failed\]" logs.txt | \
  sed -n 's/.*"\(.*\)" failed.*/\1/p' | \
  sort | uniq -c | sort -rn
```

## Monitoring in Production

### 1. Set Up Log Aggregation

Forward logs to a log aggregation service:

- **Vercel**: Automatically sends to Vercel logs
- **Datadog**: Set up log forwarder
- **CloudWatch**: Use AWS Lambda log groups
- **Logtail**: Add Logtail integration

### 2. Create Alerts

Set up alerts for:

```
# Critical: Permanent query failures
[DB Failed].*failed permanently

# Warning: Multiple retries
[DB Retry].*attempt 3/3

# Info: Slow queries
[DB Success].*[5-9][0-9]{3}ms
```

### 3. Dashboard Queries

If using Datadog, Splunk, or similar:

```
# Error rate over time
source:nodejs [DB Failed] | timeseries count()

# Average query duration
source:nodejs [DB Success] | parse "completed in *ms" as duration | avg(duration)

# Retry rate
source:nodejs [DB Retry] | timeseries count()

# Failed queries by name
source:nodejs [DB Failed] | parse "\"*\" failed" as query | group by query | count()
```

## Query Naming Convention

All database queries should use descriptive names for tracking:

```typescript
import { withRetry } from '@/lib/db';

// ✅ Good: Descriptive name
const data = await withRetry(
  () => db.query.users.findMany(),
  { queryName: 'admin-list-all-users' }
);

// ❌ Bad: Generic or missing name
const data = await withRetry(
  () => db.query.users.findMany()
  // No query name - will show as "unknown-query"
);
```

### Naming Format

Use this format: `{page/feature}-{action}-{resource}`

Examples:
- `dashboard-fetch-all-classes`
- `dashboard-class-progress-123`
- `dashboard-overall-progress-count`
- `api-create-flashcard`
- `api-update-user-progress`

## Using the Monitoring Utilities

### Track Custom Queries

```typescript
import { monitoredQuery } from '@/lib/db/monitoring';

// Simple monitoring
const result = await monitoredQuery(
  'my-custom-query',
  async () => {
    return await db.query.myTable.findMany();
  }
);

// With automatic retries
import { monitoredQueryWithRetry } from '@/lib/db/monitoring';

const result = await monitoredQueryWithRetry(
  'my-important-query',
  async () => {
    return await db.query.myTable.findMany();
  },
  3, // max retries
  1000 // initial delay ms
);
```

### Get Query Statistics

```typescript
import { getQueryStatistics } from '@/lib/db/monitoring';

// In an API endpoint
export async function GET() {
  const stats = getQueryStatistics();
  return Response.json(stats);
}
```

Returns:
```json
{
  "total": 100,
  "successful": 95,
  "failed": 5,
  "failureRate": "5.00%",
  "avgDuration": "234.56ms",
  "maxDuration": "1234.56ms",
  "minDuration": "12.34ms",
  "slowQueries": 3,
  "queriesWithRetries": 8
}
```

### Check Database Health Programmatically

```typescript
import { checkDatabaseHealth } from '@/lib/db/monitoring';

const health = await checkDatabaseHealth();

if (!health.connected) {
  console.error('Database is down!', health.error);
  // Send alert, show error page, etc.
}
```

## Performance Benchmarks

### Expected Response Times

| Query Type | Target | Warning | Critical |
|------------|--------|---------|----------|
| Simple SELECT | < 50ms | 50-200ms | > 200ms |
| JOIN (2-3 tables) | < 100ms | 100-500ms | > 500ms |
| Complex nested query | < 500ms | 500-2000ms | > 2000ms |
| Aggregation | < 200ms | 200-1000ms | > 1000ms |

### Connection Times

| Scenario | Target | Warning |
|----------|--------|---------|
| Warm connection | < 5ms | > 10ms |
| Cold start | < 2s | > 5s |
| Cross-region | < 100ms | > 500ms |

## Troubleshooting Common Issues

### High Retry Rate

**Symptom:** Many `[DB Retry]` messages in logs

**Investigation:**
```bash
# Check retry rate
grep "\[DB Retry\]" logs.txt | wc -l

# Find which queries retry most
grep "\[DB Retry\]" logs.txt | \
  sed -n 's/.*Retrying "\(.*\)" in.*/\1/p' | \
  sort | uniq -c | sort -rn
```

**Solutions:**
- Check network between app and database
- Increase connection timeout if cold starts are common
- Scale database if overloaded

### Slow Queries

**Symptom:** Many queries > 5000ms

**Investigation:**
```bash
# Get diagnostics
curl http://localhost:3000/api/diagnostics

# Look at slowQueries section
```

**Solutions:**
- Add database indexes
- Optimize query (reduce JOINs, select fewer columns)
- Add caching layer
- Paginate results

### Connection Pool Exhausted

**Symptom:** Queries wait for available connections

**Investigation:**
Check diagnostics endpoint:
```json
{
  "postgresStats": {
    "total_connections": 5,
    "active_connections": 5
  }
}
```

**Solutions:**
- Increase `max` in `src/lib/db/index.ts`
- Ensure queries release connections quickly
- Check for hanging transactions

## Integration with APM Tools

### Sentry

```typescript
import * as Sentry from '@sentry/nextjs';
import { withRetry } from '@/lib/db';

const result = await withRetry(
  async () => {
    const span = Sentry.startSpan({ name: 'db.query.users' });
    try {
      return await db.query.users.findMany();
    } finally {
      span.finish();
    }
  },
  { queryName: 'fetch-users' }
);
```

### Datadog

```typescript
import tracer from 'dd-trace';
import { withRetry } from '@/lib/db';

const result = await withRetry(
  async () => {
    return tracer.trace('db.query', { resource: 'users.findMany' }, () => {
      return db.query.users.findMany();
    });
  },
  { queryName: 'fetch-users' }
);
```

## CI/CD Integration

### Pre-deployment Health Check

```yaml
# .github/workflows/deploy.yml
- name: Check database health
  run: |
    response=$(curl -s https://your-app.com/api/health)
    status=$(echo $response | jq -r '.status')
    if [ "$status" != "healthy" ]; then
      echo "Database is unhealthy, aborting deployment"
      exit 1
    fi
```

### Post-deployment Validation

```yaml
- name: Validate deployment
  run: |
    for i in {1..5}; do
      curl -f https://your-app.com/api/health || exit 1
      sleep 2
    done
```

## Additional Resources

- [Database Timeout Investigation Guide](./DATABASE_TIMEOUT_INVESTIGATION.md)
- [Postgres Connection Documentation](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [Drizzle ORM Performance](https://orm.drizzle.team/docs/performance)
