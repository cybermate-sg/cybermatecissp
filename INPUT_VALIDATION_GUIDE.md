# Input Validation Guide with Zod

Complete guide to the type-safe input validation system using Zod schemas.

---

## 📦 Overview

The validation system provides:
- ✅ Type-safe request validation
- ✅ Automatic error formatting
- ✅ Reusable validation schemas
- ✅ Query parameter validation
- ✅ Path parameter validation
- ✅ Partial update validation
- ✅ Integration with error handler

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { validateRequest } from '@/lib/api/validate';
import { createClassSchema } from '@/lib/validations/class';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(request: Request) {
  try {
    // Validate and get type-safe data
    const data = await validateRequest(request, createClassSchema);
    // data is now: CreateClassInput type

    // Use validated data
    const result = await createClass(data);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'create class');
  }
}
```

---

## 📚 Available Validation Functions

### 1. `validateRequest()` - Request Body Validation

Validates JSON request body against a Zod schema.

```typescript
import { validateRequest } from '@/lib/api/validate';
import { createFlashcardSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const data = await validateRequest(request, createFlashcardSchema);
  // data is type-safe: CreateFlashcardInput
}
```

**Features:**
- Parses JSON automatically
- Throws ApiError on validation failure
- Returns typed data on success

---

### 2. `validateQueryParams()` - Query String Validation

Validates URL query parameters.

```typescript
import { validateQueryParams } from '@/lib/api/validate';
import { flashcardQuerySchema } from '@/lib/validations';

export async function GET(request: Request) {
  const params = validateQueryParams(request, flashcardQuerySchema);
  // params: { deckId?: string, limit: number, offset: number }

  const flashcards = await fetchFlashcards({
    deckId: params.deckId,
    limit: params.limit,
    offset: params.offset,
  });
}
```

**Use `z.coerce` for numbers:**
```typescript
const schema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
});
// URL: ?limit=25&offset=50
// Result: { limit: 25, offset: 50 }
```

---

### 3. `validatePathParams()` - Path Parameter Validation

Validates route parameters (e.g., `/api/classes/[id]`).

```typescript
import { validatePathParams } from '@/lib/api/validate';
import { classIdSchema } from '@/lib/validations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = validatePathParams(resolvedParams, classIdSchema);
  // id is validated as UUID

  const classData = await fetchClass(id);
}
```

---

### 4. `validatePartial()` - Partial Updates (PATCH/PUT)

Makes all schema fields optional - perfect for update endpoints.

```typescript
import { validatePartial } from '@/lib/api/validate';
import { updateClassSchema } from '@/lib/validations';

export async function PUT(request: Request) {
  // Only provided fields are validated
  const updates = await validatePartial(request, updateClassSchema);
  // updates: Partial<UpdateClassInput>

  // Can update just name, or just description, or both, etc.
  await db.update(classes).set(updates);
}
```

---

### 5. `safeParse()` - Non-Throwing Validation

Returns result object instead of throwing errors.

```typescript
import { safeParse } from '@/lib/api/validate';

const result = await safeParse(request, createClassSchema);

if (result.success) {
  const data = result.data; // Type-safe data
  // Process valid data
} else {
  const errors = result.errors; // ValidationErrorDetail[]
  // Handle errors without try/catch
}
```

---

## 📋 Available Validation Schemas

### Class (Domain) Schemas

```typescript
import {
  createClassSchema,
  updateClassSchema,
  classQuerySchema,
  classIdSchema,
} from '@/lib/validations/class';

// Types
import type {
  CreateClassInput,
  UpdateClassInput,
  ClassQueryParams,
  ClassIdParams,
} from '@/lib/validations/class';
```

**Fields:**
- `name`: string (1-255 chars, required)
- `description`: string (max 2000 chars, optional)
- `order`: number (int, ≥0, default 0)
- `icon`: string (max 100 chars, optional)
- `color`: string (max 50 chars, optional)
- `isPublished`: boolean (default false)

---

### Deck Schemas

```typescript
import {
  createDeckSchema,
  updateDeckSchema,
  deckQuerySchema,
  deckIdSchema,
} from '@/lib/validations/deck';

// Types
import type {
  CreateDeckInput,
  UpdateDeckInput,
  DeckQueryParams,
} from '@/lib/validations/deck';
```

**Fields:**
- `classId`: UUID (required for create)
- `name`: string (1-255 chars, required)
- `description`: string (max 2000 chars, optional)
- `order`: number (int, ≥0, default 0)
- `isPremium`: boolean (default false)
- `isPublished`: boolean (default false)

---

### Flashcard Schemas

```typescript
import {
  createFlashcardSchema,
  updateFlashcardSchema,
  flashcardQuerySchema,
  flashcardMediaSchema,
  updateProgressSchema,
  createStudySessionSchema,
  recordSessionCardSchema,
} from '@/lib/validations/flashcard';

// Types
import type {
  CreateFlashcardInput,
  UpdateFlashcardInput,
  FlashcardMedia,
  UpdateProgressInput,
} from '@/lib/validations/flashcard';
```

**Flashcard Fields:**
- `deckId`: UUID (required)
- `question`: string (1-5000 chars, required)
- `answer`: string (1-5000 chars, required)
- `explanation`: string (max 2000 chars, optional)
- `order`: number (int, ≥0, default 0)
- `isPublished`: boolean (default false)
- `media`: array of FlashcardMedia (max 10)

**Media Fields:**
- `url`: valid URL
- `key`: string (required)
- `fileName`: string (required)
- `fileSize`: positive integer
- `mimeType`: image/* (jpeg, png, gif, webp, svg)
- `placement`: 'question' | 'answer'
- `order`: number (≥0)
- `altText`: string (max 200 chars, optional)

---

### User & Subscription Schemas

```typescript
import {
  createUserSchema,
  updateUserSchema,
  createSubscriptionSchema,
  createCheckoutSchema,
  userQuerySchema,
} from '@/lib/validations/user';

// Types
import type {
  CreateUserInput,
  CreateSubscriptionInput,
  CreateCheckoutInput,
} from '@/lib/validations/user';
```

---

## 🛠️ Common Validators

Reusable validators for common fields:

```typescript
import { commonValidators } from '@/lib/api/validate';

// Examples:
commonValidators.uuid
commonValidators.name
commonValidators.email
commonValidators.description
commonValidators.order
commonValidators.boolean
commonValidators.role
commonValidators.pagination
```

**Usage in custom schemas:**
```typescript
const mySchema = z.object({
  id: commonValidators.uuid,
  name: commonValidators.name,
  email: commonValidators.email,
  order: commonValidators.order,
});
```

---

## 💡 Complete API Route Examples

### Example 1: POST with Body Validation

```typescript
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { handleApiError } from '@/lib/api/error-handler';
import { validateRequest } from '@/lib/api/validate';
import { createFlashcardSchema } from '@/lib/validations';
import { log } from '@/lib/logger';
import { db } from '@/lib/db';
import { flashcards } from '@/lib/db/schema';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();

    // Validate request body
    const validatedData = await validateRequest(request, createFlashcardSchema);

    log.info('Creating flashcard', {
      userId: admin.clerkUserId,
      deckId: validatedData.deckId,
    });

    const newFlashcard = await db
      .insert(flashcards)
      .values({
        ...validatedData,
        createdBy: admin.clerkUserId,
      })
      .returning();

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

### Example 2: GET with Query Params

```typescript
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();

    // Validate query parameters
    const params = validateQueryParams(request, flashcardQuerySchema);

    log.debug('Fetching flashcards', {
      userId: admin.clerkUserId,
      params,
    });

    const flashcards = await db.query.flashcards.findMany({
      where: params.deckId
        ? eq(flashcards.deckId, params.deckId)
        : undefined,
      limit: params.limit,
      offset: params.offset,
    });

    return NextResponse.json({
      flashcards,
      total: flashcards.length,
      limit: params.limit,
      offset: params.offset,
    });
  } catch (error) {
    return handleApiError(error, 'fetch flashcards');
  }
}
```

---

### Example 3: PUT with Path & Body Validation

```typescript
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;

    // Validate path parameters
    const { id } = validatePathParams(resolvedParams, classIdSchema);

    // Validate request body (partial update)
    const updates = await validatePartial(request, updateClassSchema);

    log.info('Updating class', {
      userId: admin.clerkUserId,
      classId: id,
      fields: Object.keys(updates),
    });

    const updated = await db
      .update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();

    return NextResponse.json({
      class: updated[0],
      message: 'Class updated successfully',
    });
  } catch (error) {
    return handleApiError(error, 'update class');
  }
}
```

---

### Example 4: DELETE with Path Validation

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const resolvedParams = await params;

    // Validate path parameters
    const { id } = validatePathParams(resolvedParams, deckIdSchema);

    log.warn('Deleting deck', {
      userId: admin.clerkUserId,
      deckId: id,
    });

    await db.delete(decks).where(eq(decks.id, id));

    return NextResponse.json({
      message: 'Deck deleted successfully',
    });
  } catch (error) {
    return handleApiError(error, 'delete deck');
  }
}
```

---

## 🎯 Error Responses

### Validation Error Response

When validation fails, the API returns:

```json
{
  "error": "Validation failed: name - Name is required",
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "name",
      "message": "Name is required",
      "code": "too_small"
    },
    {
      "field": "email",
      "message": "Must be a valid email address",
      "code": "invalid_string"
    }
  ]
}
```

**Status Code:** 400 Bad Request

---

### Invalid JSON Response

```json
{
  "error": "Invalid JSON in request body",
  "statusCode": 400,
  "code": "INVALID_JSON"
}
```

---

### Invalid UUID Response

```json
{
  "error": "Invalid path parameter: id - Must be a valid UUID",
  "statusCode": 400,
  "code": "INVALID_PATH_PARAMS",
  "details": [
    {
      "field": "id",
      "message": "Must be a valid UUID",
      "code": "invalid_string"
    }
  ]
}
```

---

## 🔧 Creating Custom Schemas

### Simple Schema

```typescript
import { z } from 'zod';
import { commonValidators } from '@/lib/api/validate';

export const myCustomSchema = z.object({
  title: commonValidators.name,
  description: commonValidators.description,
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

export type MyCustomInput = z.infer<typeof myCustomSchema>;
```

---

### Schema with Refinements

```typescript
export const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);
```

---

### Schema with Transformations

```typescript
export const searchSchema = z.object({
  query: z.string().trim().toLowerCase(),
  limit: z.coerce.number().min(1).max(100).default(10),
  tags: z.string()
    .optional()
    .transform(val => val ? val.split(',').map(t => t.trim()) : []),
});

// URL: ?query=HELLO&limit=25&tags=tag1,tag2,tag3
// Result: {
//   query: 'hello',
//   limit: 25,
//   tags: ['tag1', 'tag2', 'tag3']
// }
```

---

## 🧪 Testing Validation

### Test Valid Input

```typescript
// POST /api/admin/classes
const response = await fetch('/api/admin/classes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'CISSP Security',
    description: 'Security fundamentals',
    order: 1,
    icon: '🔒',
    color: 'blue',
    isPublished: true,
  }),
});

// Expected: 200 OK with created class
```

---

### Test Invalid Input

```typescript
// Missing required field
const response = await fetch('/api/admin/classes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Missing name',
  }),
});

// Expected: 400 Bad Request
// {
//   "error": "Validation failed: name - Name is required",
//   "statusCode": 400,
//   "code": "VALIDATION_ERROR"
// }
```

---

### Test Type Validation

```typescript
// Invalid type
const response = await fetch('/api/admin/classes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Valid Name',
    order: 'not-a-number', // Should be number
  }),
});

// Expected: 400 Bad Request with validation details
```

---

## 📊 Migration Checklist

For each API route:

- [ ] Import validation utilities
- [ ] Import relevant schemas
- [ ] Replace manual validation with `validateRequest()`
- [ ] Validate query params with `validateQueryParams()`
- [ ] Validate path params with `validatePathParams()`
- [ ] Use `validatePartial()` for PUT/PATCH endpoints
- [ ] Remove manual field extraction
- [ ] Use type-safe validated data
- [ ] Test with valid inputs
- [ ] Test with invalid inputs
- [ ] Verify error responses

---

## ✅ Best Practices

### 1. Always Validate User Input

```typescript
// ❌ BAD: No validation
const { name, email } = await request.json();

// ✅ GOOD: Validated
const { name, email } = await validateRequest(request, userSchema);
```

---

### 2. Use Type-Safe Data

```typescript
// ❌ BAD: Untyped
const body = await request.json();
const result = await createClass(body);

// ✅ GOOD: Type-safe
const validatedData: CreateClassInput = await validateRequest(request, createClassSchema);
const result = await createClass(validatedData);
```

---

### 3. Validate All Input Sources

```typescript
// Validate body
const body = await validateRequest(request, createSchema);

// Validate query params
const query = validateQueryParams(request, querySchema);

// Validate path params
const { id } = validatePathParams(params, idSchema);
```

---

### 4. Use Partial for Updates

```typescript
// ✅ GOOD: Allows partial updates
const updates = await validatePartial(request, updateSchema);

// Only provided fields are validated and updated
await db.update(table).set(updates);
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/lib/validations'"

**Solution:** Use full import path:
```typescript
import { createClassSchema } from '@/lib/validations/class';
```

---

### Issue: Query params always strings

**Solution:** Use `z.coerce` to convert:
```typescript
const schema = z.object({
  limit: z.coerce.number().min(1).max(100),
  // Converts "10" → 10
});
```

---

### Issue: Validation passes but database fails

**Solution:** Add database-level constraints:
```typescript
export const createClassSchema = z.object({
  name: z.string().min(1).max(255),
  // Matches database VARCHAR(255) constraint
});
```

---

## 📚 Resources

- [Zod Documentation](https://zod.dev/)
- [Zod Error Handling](https://zod.dev/ERROR_HANDLING)
- [Common Validators](/src/lib/api/validate.ts)
- [All Schemas](/src/lib/validations/)

---

## 📋 Summary

**Files Created:**
- `/src/lib/api/validate.ts` - Validation utilities
- `/src/lib/validations/class.ts` - Class schemas
- `/src/lib/validations/deck.ts` - Deck schemas
- `/src/lib/validations/flashcard.ts` - Flashcard schemas
- `/src/lib/validations/user.ts` - User/subscription schemas
- `/src/lib/validations/index.ts` - Central export

**Routes Updated:**
- `/api/admin/classes/route.ts` - Full validation
- `/api/admin/classes/[id]/route.ts` - Full validation

**Benefits:**
- ✅ Type-safe request handling
- ✅ Automatic error formatting
- ✅ Consistent validation across app
- ✅ Better error messages for clients
- ✅ Prevents invalid data in database
- ✅ Self-documenting API contracts

---

**Status:** ✅ Validation System Complete
**Updated:** 2025-11-03
**Priority 1 - Task 3:** Complete
