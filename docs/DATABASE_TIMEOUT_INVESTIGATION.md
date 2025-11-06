# Database Connection Timeout Investigation Guide

This guide helps you identify, investigate, and prevent database connection timeout errors.

## Quick Start: Check Current Status

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

This provides a quick overview of database connectivity and response time.

### 2. Detailed Diagnostics (Development Only)
```bash
curl http://localhost:3000/api/diagnostics
```

For production, set `DIAGNOSTICS_KEY` env var and use:
```bash
curl -H "Authorization: Bearer YOUR_KEY" https://your-app.com/api/diagnostics
```

## Understanding Connection Timeout Errors

### Common Error Messages

1. **`Error: write CONNECT_TIMEOUT undefined:undefined`**
   - **Cause**: Unable to establish connection within the timeout period (30 seconds)
   - **Common Reasons**:
     - Cold start (serverless function waking up)
     - Network issues between app and database
     - Database is overwhelmed with connections
     - Database server is slow to respond

2. **`Connection terminated`**
   - **Cause**: Active connection dropped
   - **Common Reasons**:
     - Database server restart
     - Network interruption
     - Idle connection closed by server

3. **`ETIMEDOUT` or `ECONNREFUSED`**
   - **Cause**: Network-level connection failure
   - **Common Reasons**:
     - Database server down
     - Firewall blocking connection
     - Incorrect connection string

## Investigation Steps

### Step 1: Check Application Logs

Look for these log patterns:

```
[DB Error] Attempt X/Y for "query-name" failed after Zms
[DB Retry] Retrying "query-name" in Xms
[DB Failed] "query-name" failed permanently after Xms and Y attempts
[DB Success] "query-name" completed in Xms
```

**What to look for:**
- **Query names** that consistently fail
- **Duration times** - high values indicate slow queries
- **Retry patterns** - many retries suggest network instability
- **Error codes** - identify the specific failure type

### Step 2: Check Database Diagnostics

Visit `/api/diagnostics` to get detailed information:

#### Key Metrics to Check

1. **Connection Pool Status**
   ```json
   {
     "postgresStats": {
       "total_connections": 5,
       "active_connections": 2,
       "idle_connections": 3,
       "idle_in_transaction": 0
     }
   }
   ```

   **Analysis:**
   - `total_connections` approaching `maxPoolSize` (5) = pool exhaustion
   - High `idle_in_transaction` = transactions not being committed
   - `active_connections` near max = high load

2. **Response Time**
   ```json
   {
     "database": {
       "responseTime": 1234.56
     }
   }
   ```

   **Normal:** < 100ms
   **Slow:** 100-1000ms
   **Critical:** > 1000ms

3. **Longest Query Duration**
   ```json
   {
     "postgresStats": {
       "longest_query_duration": "00:00:15.234"
     }
   }
   ```

   If this exceeds 25 seconds, queries will timeout.

### Step 3: Analyze Query Performance

Look at the logs for specific query patterns:

```bash
# In production logs
grep "DB Error" logs.txt | grep "dashboard-fetch-all-classes"
grep "DB Success" logs.txt | grep "dashboard-fetch-all-classes"
```

**Identify:**
- Which queries fail most often?
- Which queries are slowest?
- Is there a pattern (time of day, specific users)?

### Step 4: Check Database Health

Run these queries directly on your database:

```sql
-- Check active connections
SELECT count(*), state
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Find long-running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < now() - interval '10 seconds'
ORDER BY duration DESC;

-- Check for lock waits
SELECT blocked.pid AS blocked_pid,
       blocking.pid AS blocking_pid,
       blocked.query AS blocked_query
FROM pg_stat_activity blocked
JOIN pg_stat_activity blocking
  ON blocking.pid = ANY(pg_blocking_pids(blocked.pid))
WHERE blocked.wait_event_type = 'Lock';

-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## Common Causes and Solutions

### 1. Cold Start Delays (Serverless)

**Symptoms:**
- First request after idle period is slow (> 10s)
- Subsequent requests are fast
- Error: `CONNECT_TIMEOUT`

**Solution:**
- ✅ Already implemented: Connection timeout increased to 30s
- ✅ Already implemented: Warmup system keeps connections alive
- Consider: Upgrade to reserved instance (no cold starts)

**Monitoring:**
```javascript
// Check if warmup is running
grep "DB Warmup" logs.txt
```

### 2. Connection Pool Exhaustion

**Symptoms:**
- Errors occur under load
- `total_connections` = `maxPoolSize` (5)
- New requests wait for available connections

**Solution:**
```typescript
// In src/lib/db/index.ts
const client = postgres(connectionString, {
  max: 10, // Increase from 5 to 10
  // ... other config
});
```

**Trade-off:** More connections = more memory usage. Monitor your hosting plan limits.

### 3. Slow Queries

**Symptoms:**
- Specific queries consistently take > 5s
- `longest_query_duration` > 25s
- Timeout errors for complex queries

**Solutions:**

a) **Add Indexes:**
```sql
-- Example: If class progress queries are slow
CREATE INDEX idx_user_card_progress_user_card
ON user_card_progress(clerk_user_id, flashcard_id);
```

b) **Optimize Query:**
```typescript
// Instead of loading all data
const allData = await db.query.classes.findMany({
  with: { decks: { with: { flashcards: true }}}
});

// Load only what you need
const allData = await db.query.classes.findMany({
  with: {
    decks: {
      with: {
        flashcards: {
          columns: { id: true } // Only ID
        }
      }
    }
  }
});
```

c) **Add Caching:**
```typescript
import { cache } from '@/lib/redis';

const cacheKey = `classes:all`;
let classes = await cache.get(cacheKey);

if (!classes) {
  classes = await db.query.classes.findMany(...);
  await cache.set(cacheKey, classes, { ttl: 300 }); // 5 min cache
}
```

### 4. Network Issues

**Symptoms:**
- Random timeouts with no pattern
- Errors: `ETIMEDOUT`, `ECONNRESET`
- Diagnostics show database is healthy

**Solution:**
- ✅ Already implemented: Retry logic with exponential backoff
- Check network between your hosting and database
- Consider moving database closer to application region

### 5. Database Overload

**Symptoms:**
- High `active_connections`
- Slow response times across all queries
- Database CPU/memory at capacity

**Solutions:**
- Scale database (upgrade plan)
- Optimize queries (see #3)
- Add read replicas for read-heavy workloads
- Implement rate limiting

## Prevention Strategies

### 1. Monitoring & Alerts

Set up monitoring for:
- Response time > 1000ms
- Connection pool usage > 80%
- Error rate > 1%
- Failed retries

**Tools:**
- Sentry for error tracking
- Datadog/New Relic for APM
- Database provider's monitoring (Xata, Neon, etc.)

### 2. Query Performance Testing

Before deploying, test queries with realistic data:

```bash
# Run with production-like data volumes
npm run seed # or your seed command

# Load test
ab -n 1000 -c 10 http://localhost:3000/dashboard
```

### 3. Connection Pool Tuning

Monitor and adjust based on usage:

```typescript
// For high-traffic apps
max: 10,
idle_timeout: 10,

// For low-traffic apps
max: 3,
idle_timeout: 30,
```

### 4. Graceful Degradation

Add fallbacks for when database is slow:

```typescript
try {
  const data = await withRetry(
    () => db.query.complexQuery(),
    { queryName: 'complex-query', maxRetries: 2 }
  );
} catch (error) {
  // Return cached or default data
  console.error('Failed to load data, using defaults');
  return getDefaultData();
}
```

## Configuration Reference

Current database connection settings:

| Setting | Value | Purpose |
|---------|-------|---------|
| `max` | 5 | Maximum connections in pool |
| `idle_timeout` | 20s | Release idle connections after |
| `max_lifetime` | 5min | Maximum connection lifetime |
| `connect_timeout` | 30s | Timeout for establishing connection |
| `timeout` | 25s | Timeout for query execution |

To change these, edit `src/lib/db/index.ts`.

## Emergency Troubleshooting

If database is completely unresponsive:

1. **Check database provider status page**
   - Xata: https://status.xata.io
   - Vercel Postgres: https://www.vercel-status.com
   - Neon: https://neonstatus.com

2. **Restart your application**
   ```bash
   # Redeploy on Vercel
   vercel --prod

   # Or restart locally
   npm run dev
   ```

3. **Clear connection pool**
   - Restart application (forces new connections)
   - Check for stuck transactions in database

4. **Failover to backup database** (if configured)
   ```bash
   DATABASE_URL=your-backup-db-url npm run dev
   ```

## Getting Help

When reporting database timeout issues, include:

1. **Error message** (full stack trace)
2. **Query name** (from logs)
3. **Diagnostics output** (from `/api/diagnostics`)
4. **Frequency** (how often does it happen?)
5. **Pattern** (specific time, specific user, specific page?)
6. **Recent changes** (code, database, infrastructure)

## Useful Commands

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Monitor active connections
watch -n 2 'psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"'

# Find slow queries in real-time
psql $DATABASE_URL -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()))"
```

## Related Files

- `src/lib/db/index.ts` - Database configuration and connection
- `src/lib/db/monitoring.ts` - Monitoring utilities
- `src/lib/db/warmup.ts` - Connection warmup
- `src/app/api/health/route.ts` - Health check endpoint
- `src/app/api/diagnostics/route.ts` - Diagnostics endpoint
