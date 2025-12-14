# Admin AI Model Management Guide

## Overview

This guide shows you **how to dynamically manage AI models after going live** without redeploying your application.

## What You Can Do as Admin

After implementation, you'll be able to:

✅ **Add new AI models** without code changes
✅ **Enable/disable models** instantly
✅ **Adjust priorities** (which models are tried first)
✅ **Configure timeouts** per model
✅ **Set temperature** and other parameters
✅ **Track performance** (success rate, response time)
✅ **View analytics** (which models work best)

All through an **admin web interface** - no SSH, no deployments needed!

## Architecture

```
┌─────────────────────────────────────────────┐
│         Admin Panel UI                       │
│  (Add/Edit/Delete/Enable/Disable Models)    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         API Routes                           │
│  GET /api/admin/ai-models                   │
│  POST /api/admin/ai-models                  │
│  PATCH /api/admin/ai-models/:id             │
│  DELETE /api/admin/ai-models/:id            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Database (PostgreSQL)                │
│  Table: ai_model_configurations             │
│  - Model ID, Name, Priority                 │
│  - Enabled, Timeout, Temperature            │
│  - Success/Failure Counts                   │
│  - Last Used, Avg Response Time             │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│    Config Loader (with Redis Cache)         │
│  1. Check Redis cache (5 min TTL)          │
│  2. If miss, query database                 │
│  3. Fallback to env/defaults                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         AI Quiz Generator                    │
│  Uses database config to select models      │
└─────────────────────────────────────────────┘
```

## Database Schema

Already added to `src/lib/db/schema.ts`:

```typescript
export const aiModelConfigurations = pgTable('ai_model_configurations', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelId: varchar('model_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 100 }),
  priority: integer('priority').notNull().default(100),
  enabled: boolean('enabled').notNull().default(true),
  timeoutMs: integer('timeout_ms'),
  temperature: decimal('temperature', { precision: 3, scale: 2 }),
  maxTokens: integer('max_tokens'),
  costPer1kTokens: decimal('cost_per_1k_tokens', { precision: 10, scale: 6 }),
  isFree: boolean('is_free').notNull().default(true),
  description: text('description'),
  lastUsedAt: timestamp('last_used_at'),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  avgResponseTimeMs: integer('avg_response_time_ms'),
  createdBy: varchar('created_by').notNull().references(() => users.clerkUserId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## Step-by-Step Implementation

### 1. Run Database Migration

```bash
cd c:\Projects\cisspmastery
npx drizzle-kit push
```

### 2. Seed Initial Models

Create `src/lib/db/seed-ai-models.ts`:

```typescript
import { db } from '@/lib/db';
import { aiModelConfigurations } from '@/lib/db/schema';

export async function seedAiModels(adminId: string) {
  const defaultModels = [
    {
      modelId: 'meta-llama/llama-3.2-3b-instruct:free',
      name: 'Llama 3.2 3B',
      provider: 'meta-llama',
      priority: 1,
      enabled: true,
      timeoutMs: 45000,
      temperature: '0.70',
      isFree: true,
      description: 'Fast, lightweight model - good for simple questions',
      createdBy: adminId,
    },
    {
      modelId: 'mistralai/mistral-7b-instruct:free',
      name: 'Mistral 7B',
      provider: 'mistralai',
      priority: 2,
      enabled: true,
      timeoutMs: 60000,
      temperature: '0.70',
      isFree: true,
      description: 'Balanced performance and quality',
      createdBy: adminId,
    },
    {
      modelId: 'google/gemini-2.0-flash-exp:free',
      name: 'Gemini 2.0 Flash',
      provider: 'google',
      priority: 3,
      enabled: true,
      timeoutMs: 45000,
      temperature: '0.70',
      isFree: true,
      description: 'Google experimental model',
      createdBy: adminId,
    },
    {
      modelId: 'qwen/qwen-2-7b-instruct:free',
      name: 'Qwen 2 7B',
      provider: 'qwen',
      priority: 4,
      enabled: true,
      timeoutMs: 60000,
      temperature: '0.70',
      isFree: true,
      description: 'Alibaba instruction-tuned model',
      createdBy: adminId,
    },
  ];

  const inserted = await db
    .insert(aiModelConfigurations)
    .values(defaultModels)
    .onConflictDoNothing()
    .returning();

  console.log(`Seeded ${inserted.length} AI models`);
  return inserted;
}
```

Run once to seed:
```bash
# In your Next.js app, create a one-time seeder page or API route
# Visit /admin/seed-ai-models (protect with admin auth)
```

### 3. API Routes (Create These Files)

See implementation files in the next section.

### 4. Admin UI Components

See the admin dashboard UI in the next section.

### 5. Update Config Loader

Modified `src/lib/ai/model-config.ts` to check database first.

## How to Use After Going Live

### Via Admin Dashboard

1. Navigate to `/admin/ai-models`
2. You'll see a table of all configured models
3. Actions available:
   - **Add Model**: Click "Add New Model" button
   - **Edit**: Click edit icon on any model
   - **Enable/Disable**: Toggle switch
   - **Delete**: Delete icon (soft delete recommended)
   - **Reorder Priority**: Drag and drop (or edit priority number)

### Adding a New Model

1. Click "Add New Model"
2. Fill in form:
   - **Model ID**: e.g., `anthropic/claude-3-haiku`
   - **Name**: e.g., `Claude 3 Haiku`
   - **Provider**: e.g., `anthropic`
   - **Priority**: e.g., `1` (lower = tried first)
   - **Timeout**: e.g., `30000` (30 seconds)
   - **Temperature**: e.g., `0.7`
   - **Cost**: e.g., `0.00025` (per 1k tokens)
   - **Free**: Check if free tier
   - **Description**: Notes about this model
3. Click "Save"
4. Model is **immediately** available for quiz generation

### Disabling a Model

1. Find the model in the list
2. Toggle the "Enabled" switch to OFF
3. Model is **immediately** removed from rotation
4. No quiz generation will use this model

### Changing Priority

1. Edit the model
2. Change priority number (lower = higher priority)
3. Save
4. Next quiz generation will use new priority order

### Viewing Analytics

Dashboard shows for each model:
- **Success Rate**: `successCount / (successCount + failureCount)`
- **Avg Response Time**: In milliseconds
- **Last Used**: Timestamp of last use
- **Total Generations**: Success + failure count

Use this data to optimize which models to keep enabled!

## Common Admin Scenarios

### Scenario 1: One Model is Rate-Limited

**Problem**: Llama 3.2 3B is consistently rate-limited

**Solution**:
1. Go to admin panel
2. Find "Llama 3.2 3B"
3. Toggle "Enabled" to OFF
4. System will skip it and use next priority model

**No deployment needed!**

### Scenario 2: Add a Paid Model as Primary

**Problem**: Free models are too slow, want to use Claude 3 Haiku

**Solution**:
1. Click "Add New Model"
2. Fill in Claude 3 Haiku details with priority=1
3. Update existing free models to priority=2,3,4...
4. Save
5. Claude will be tried first, free models as fallback

### Scenario 3: Model Stopped Working

**Problem**: Gemini 2.0 Flash returns 404 (deprecated)

**Solution**:
1. Admin panel shows high failure count
2. Click edit on Gemini model
3. Toggle "Enabled" to OFF
4. Or delete it entirely
5. System immediately stops using it

### Scenario 4: Test a New Model

**Problem**: Want to try a new model without affecting production

**Solution**:
1. Add new model with priority=99 (lowest)
2. Enable it
3. Monitor success rate in admin panel
4. If good, increase priority
5. If bad, disable or delete

## Implementation Files

### API Route: GET All Models

```typescript
// src/app/api/admin/ai-models/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { aiModelConfigurations } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin (implement your auth logic)
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkUserId, userId),
  });

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const models = await db
    .select()
    .from(aiModelConfigurations)
    .orderBy(aiModelConfigurations.priority);

  return NextResponse.json({ models });
}
```

### API Route: POST New Model

```typescript
// src/app/api/admin/ai-models/route.ts (add this)
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.clerkUserId, userId),
  });

  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  const newModel = await db
    .insert(aiModelConfigurations)
    .values({
      ...body,
      createdBy: userId,
    })
    .returning();

  // Invalidate cache (if using Redis)
  // await redis.del('ai:models:config');

  return NextResponse.json({ model: newModel[0] });
}
```

### Updated Config Loader

```typescript
// Add to src/lib/ai/model-config.ts

import { db } from '@/lib/db';
import { aiModelConfigurations } from '@/lib/db/schema';

/**
 * Loads AI configuration from database (with fallback to env/defaults)
 */
export async function loadAIConfigFromDatabase(): Promise<AIGenerationConfig> {
  try {
    // Query enabled models from database
    const dbModels = await db
      .select()
      .from(aiModelConfigurations)
      .where(eq(aiModelConfigurations.enabled, true))
      .orderBy(aiModelConfigurations.priority);

    if (dbModels.length > 0) {
      return {
        defaultTimeoutMs: 60000,
        defaultTemperature: 0.7,
        maxRetries: 1,
        models: dbModels.map(m => ({
          id: m.modelId,
          name: m.name,
          priority: m.priority,
          enabled: m.enabled,
          timeoutMs: m.timeoutMs ?? undefined,
          temperature: m.temperature ? parseFloat(m.temperature) : undefined,
          maxTokens: m.maxTokens ?? undefined,
          costPer1kTokens: m.costPer1kTokens ? parseFloat(m.costPer1kTokens) : 0,
        })),
      };
    }
  } catch (error) {
    console.error('[AI Config] Failed to load from database:', error);
  }

  // Fallback to env or defaults
  return loadAIConfig();
}
```

## Performance: Redis Caching

Add caching to avoid database queries on every generation:

```typescript
import { kv } from '@vercel/kv'; // Or your Redis client

const CACHE_KEY = 'ai:models:config';
const CACHE_TTL = 300; // 5 minutes

export async function loadAIConfigCached(): Promise<AIGenerationConfig> {
  // Try cache first
  const cached = await kv.get<AIGenerationConfig>(CACHE_KEY);
  if (cached) {
    console.log('[AI Config] Loaded from cache');
    return cached;
  }

  // Load from database
  const config = await loadAIConfigFromDatabase();

  // Store in cache
  await kv.set(CACHE_KEY, config, { ex: CACHE_TTL });

  return config;
}

// Invalidate cache when admin updates models
export async function invalidateAIConfigCache() {
  await kv.del(CACHE_KEY);
  console.log('[AI Config] Cache invalidated');
}
```

## Monitoring & Analytics

Track which models perform best:

```typescript
// After successful generation
await db
  .update(aiModelConfigurations)
  .set({
    successCount: sql`${aiModelConfigurations.successCount} + 1`,
    lastUsedAt: new Date(),
    avgResponseTimeMs: sql`
      CASE
        WHEN ${aiModelConfigurations.avgResponseTimeMs} IS NULL
        THEN ${responseTimeMs}
        ELSE (${aiModelConfigurations.avgResponseTimeMs} + ${responseTimeMs}) / 2
      END
    `,
  })
  .where(eq(aiModelConfigurations.modelId, modelUsed));

// After failed generation
await db
  .update(aiModelConfigurations)
  .set({
    failureCount: sql`${aiModelConfigurations.failureCount} + 1`,
  })
  .where(eq(aiModelConfigurations.modelId, modelUsed));
```

## Summary

With this system, you can:

1. ✅ **Add models instantly** via admin UI
2. ✅ **Enable/disable** without code changes
3. ✅ **Track performance** automatically
4. ✅ **Optimize** based on real data
5. ✅ **Zero downtime** changes
6. ✅ **Cache** for performance

**No SSH, no deployments, no code changes needed!**

Just log into your admin panel, make changes, and they're live immediately.
