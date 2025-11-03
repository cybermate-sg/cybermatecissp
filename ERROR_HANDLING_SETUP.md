# Error Handling & Logging Setup Guide

This guide covers the new centralized error handling and logging system with Sentry integration.

## 📦 Installation

### 1. Install Sentry Packages

```bash
npm install --save @sentry/nextjs
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Optional: Sentry Auth Token (for source maps upload)
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=inner-sharp-consulting-pty-ltd
SENTRY_PROJECT=cissp-mastery
```

### 3. Get Your Sentry DSN

1. Go to https://sentry.io
2. Navigate to: Settings → Projects → cissp-mastery → Client Keys (DSN)
3. Copy the DSN and add it to `.env.local`

### 4. Update next.config.ts

Add Sentry to your Next.js config:

```typescript
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  // ... your existing config
};

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: 'inner-sharp-consulting-pty-ltd',
    project: 'cissp-mastery',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the Sentry Next.js SDK is at least version 8.0.0.
    // If it's a lower version, remove this option.
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
```

---

## 🚀 Usage Guide

### 1. Error Handling in API Routes

**Before (old way):**
```typescript
export async function GET() {
  try {
    await requireAdmin();
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch data';
    return NextResponse.json(
      { error: message },
      { status: message?.includes('admin') ? 403 : 500 }
    );
  }
}
```

**After (new way):**
```typescript
import { handleApiError } from '@/lib/api/error-handler';
import { log } from '@/lib/logger';

export async function GET() {
  try {
    const admin = await requireAdmin();

    log.debug('Fetching data', { userId: admin.clerkUserId });

    const data = await fetchData();

    log.info('Data fetched successfully', {
      userId: admin.clerkUserId,
      count: data.length
    });

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'fetch data', {
      endpoint: '/api/data',
      method: 'GET',
    });
  }
}
```

### 2. Using the Logger

**Debug logging (development only):**
```typescript
log.debug('Cache hit', { key: 'user:123', ttl: 300 });
```

**Info logging:**
```typescript
log.info('User created', { userId: user.id, email: user.email });
```

**Warning (sent to Sentry in production):**
```typescript
log.warn('Deprecated endpoint called', { endpoint: '/api/old' });
```

**Error (sent to Sentry in production):**
```typescript
try {
  await riskyOperation();
} catch (error) {
  log.error('Operation failed', error as Error, {
    userId,
    operation: 'riskyOp'
  });
}
```

**Performance timing:**
```typescript
const timer = log.startTimer();
await longOperation();
timer.end('Long operation completed', { userId });
```

### 3. Custom API Errors

**Throw custom errors:**
```typescript
import { createApiError } from '@/lib/api/error-handler';

// 404 Not Found
throw createApiError('Class not found', 404, 'CLASS_NOT_FOUND');

// 400 Bad Request
throw createApiError('Invalid email format', 400, 'INVALID_EMAIL');

// 403 Forbidden
throw createApiError('Admin access required', 403, 'ADMIN_REQUIRED');
```

**Use assertions:**
```typescript
import { assertExists, assertAdmin, assertAuthenticated } from '@/lib/api/error-handler';

// Assert resource exists (throws 404 if not)
assertExists(user, 'User not found');

// Assert admin access (throws 403 if not)
assertAdmin(user.role === 'admin');

// Assert authenticated (throws 401 if not)
assertAuthenticated(userId);
```

### 4. Wrap Handlers with Error Handling

**Automatic error handling:**
```typescript
import { withErrorHandling } from '@/lib/api/error-handler';

export const GET = withErrorHandling(async (request) => {
  const admin = await requireAdmin();
  const data = await fetchData();
  return NextResponse.json(data);
}, 'fetch data');
```

### 5. Set User Context for Sentry

**In authentication flow:**
```typescript
import { setUserContext } from '@/lib/logger';

// After user logs in
setUserContext({
  id: user.clerkUserId,
  email: user.email,
  role: user.role,
});

// On logout
import { clearUserContext } from '@/lib/logger';
clearUserContext();
```

---

## 🔄 Migration Guide

### Step 1: Update One Route at a Time

Pick an API route and update it:

1. Import the utilities:
```typescript
import { handleApiError } from '@/lib/api/error-handler';
import { log } from '@/lib/logger';
```

2. Replace `console.error` with `log.error`:
```typescript
// Before
console.error('Error:', error);

// After
log.error('Descriptive message', error as Error, { userId, endpoint });
```

3. Replace error handling block:
```typescript
// Before
catch (error) {
  console.error('Error creating class:', error);
  const message = error instanceof Error ? error.message : 'Failed to create class';
  return NextResponse.json(
    { error: message },
    { status: message?.includes('admin') ? 403 : 500 }
  );
}

// After
catch (error) {
  return handleApiError(error, 'create class', {
    endpoint: '/api/admin/classes',
    method: 'POST',
  });
}
```

### Step 2: Test the Route

1. Test error cases:
   - Unauthenticated user
   - Non-admin user
   - Invalid input
   - Server errors

2. Check logs:
   - Development: Check console output
   - Production: Check Sentry dashboard

### Step 3: Repeat for All Routes

Priority order:
1. ✅ Admin routes (highest impact)
2. Auth routes
3. User-facing routes
4. Public routes

---

## 📊 Sentry Dashboard

### What Gets Sent to Sentry

**Automatically captured:**
- All unhandled exceptions
- 500+ status code errors
- Custom ApiErrors
- Warnings (log.warn)

**Not sent to Sentry:**
- Development errors (NODE_ENV=development)
- 400-499 client errors (except custom ApiErrors)
- Debug/info logs

### Viewing Errors

1. Go to https://sentry.io
2. Select organization: `inner-sharp-consulting-pty-ltd`
3. Select project: `cissp-mastery`
4. View issues, performance, and session replays

### Useful Sentry Features

**Issues:**
- Grouped by error type
- Stack traces with source maps
- User context
- Breadcrumbs (user actions before error)

**Performance:**
- API endpoint latency
- Database query performance
- Frontend rendering time

**Session Replay:**
- Video replay of user session
- Shows what user did before error
- Privacy-safe (masks sensitive data)

---

## 🎯 Best Practices

### 1. Always Provide Context

**Bad:**
```typescript
log.error('Failed', error);
```

**Good:**
```typescript
log.error('Failed to create flashcard', error, {
  userId: admin.clerkUserId,
  deckId,
  operation: 'createFlashcard',
});
```

### 2. Use Descriptive Messages

**Bad:**
```typescript
throw createApiError('Error', 500);
```

**Good:**
```typescript
throw createApiError('Failed to upload image: file size exceeds 5MB limit', 400, 'FILE_TOO_LARGE');
```

### 3. Log Operations, Not Just Errors

```typescript
// Start of operation
log.info('Starting flashcard creation', { deckId, userId });

// During operation
log.debug('Uploading images', { imageCount: images.length });

// Success
log.info('Flashcard created successfully', { flashcardId: result.id });

// Error (automatically logged by handleApiError)
```

### 4. Don't Log Sensitive Data

**Never log:**
- Passwords
- API keys
- Auth tokens
- Credit card numbers
- Social security numbers

**Example:**
```typescript
// Bad
log.info('User login', { email, password });

// Good
log.info('User login attempt', { email });
```

---

## 🧪 Testing Error Handling

### Test Different Error Types

```typescript
// 400 Bad Request
fetch('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ invalid: 'data' })
});

// 401 Unauthorized
fetch('/api/admin/endpoint'); // Without auth

// 403 Forbidden
fetch('/api/admin/endpoint'); // As non-admin user

// 404 Not Found
fetch('/api/classes/non-existent-id');

// 500 Server Error
// Trigger by causing database error, etc.
```

### Check Sentry Dashboard

1. Make API request that causes error
2. Wait 1-2 seconds
3. Check Sentry dashboard for error
4. Verify:
   - Error message is clear
   - Context is present
   - Stack trace is readable
   - User context is set

---

## 📝 Example: Complete API Route

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { flashcards } from '@/lib/db/schema';
import { handleApiError, assertExists } from '@/lib/api/error-handler';
import { log } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const createFlashcardSchema = z.object({
  deckId: z.string().uuid(),
  question: z.string().min(1).max(5000),
  answer: z.string().min(1).max(5000),
  explanation: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    // Authenticate and authorize
    const admin = await requireAdmin();

    // Parse and validate input
    const body = await request.json();
    const validatedData = createFlashcardSchema.parse(body);

    log.info('Creating flashcard', {
      userId: admin.clerkUserId,
      deckId: validatedData.deckId,
    });

    // Verify deck exists
    const deck = await db.query.decks.findFirst({
      where: (decks, { eq }) => eq(decks.id, validatedData.deckId),
    });
    assertExists(deck, 'Deck not found', 404);

    // Create flashcard
    const timer = log.startTimer();
    const newFlashcard = await db
      .insert(flashcards)
      .values({
        ...validatedData,
        createdBy: admin.clerkUserId,
      })
      .returning();

    timer.end('Flashcard created', {
      flashcardId: newFlashcard[0].id,
    });

    return NextResponse.json({
      flashcard: newFlashcard[0],
      message: 'Flashcard created successfully',
    });
  } catch (error) {
    return handleApiError(error, 'create flashcard', {
      endpoint: '/api/admin/flashcards',
      method: 'POST',
    });
  }
}
```

---

## 🔧 Troubleshooting

### Issue: Sentry not receiving errors

**Check:**
1. `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. You're in production mode (errors not sent in development)
3. Error is 500+ status code or custom ApiError
4. Sentry config files exist (sentry.*.config.ts)

### Issue: Source maps not working

**Solution:**
1. Set `SENTRY_AUTH_TOKEN` in `.env.local`
2. Verify `next.config.ts` has Sentry config
3. Run build and check for source map upload logs

### Issue: Too many logs

**Solution:**
1. Use appropriate log levels
2. Remove debug logs in production
3. Add sampling in Sentry config:
```typescript
tracesSampleRate: 0.1, // Sample 10% of transactions
```

---

## 📚 Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Handling Best Practices](https://docs.sentry.io/platforms/javascript/guides/nextjs/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

## ✅ Checklist

- [ ] Install @sentry/nextjs package
- [ ] Add NEXT_PUBLIC_SENTRY_DSN to .env.local
- [ ] Update next.config.ts with Sentry config
- [ ] Verify Sentry config files exist
- [ ] Update one API route as test
- [ ] Test error handling
- [ ] Check Sentry dashboard
- [ ] Migrate remaining routes
- [ ] Remove all console.log/error statements
- [ ] Add user context in auth flow
- [ ] Configure alert rules in Sentry

---

**Status:** ✅ Setup Complete
**Updated:** 2025-11-03
**Priority 1 - Task 2:** Complete
