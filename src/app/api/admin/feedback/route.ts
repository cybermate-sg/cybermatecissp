import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { userFeedback } from '@/lib/db/schema';
import { handleApiError } from '@/lib/api/error-handler';
import { feedbackQuerySchema } from '@/lib/validations/feedback';
import { eq, and, desc, asc, SQL, count } from 'drizzle-orm';
import { log } from '@/lib/logger';

/**
 * GET /api/admin/feedback
 * Get paginated list of feedback with filters (admin only)
 *
 * Query parameters:
 * - status: Filter by feedback status (pending, in_review, resolved, closed, rejected)
 * - type: Filter by feedback type (content_error, typo, unclear_explanation, technical_issue, general_suggestion)
 * - priority: Filter by priority (low, medium, high, critical)
 * - flashcardId: Filter by flashcard ID
 * - deckId: Filter by deck ID
 * - classId: Filter by class ID
 * - limit: Number of results per page (1-100, default 50)
 * - offset: Number of results to skip (default 0)
 * - sortBy: Sort field (createdAt, priority, status, default createdAt)
 * - sortOrder: Sort order (asc, desc, default desc)
 *
 * Security:
 * - Admin only
 * - Input validation via Zod
 *
 * Returns:
 * - feedback: Array of feedback items with user and content relations
 * - total: Total count of feedback matching filters
 * - limit: Applied limit
 * - offset: Applied offset
 */
async function getFeedbackList(request: NextRequest) {
  try {
    // 1. Require admin authentication
    await requireAdmin();

    // 2. Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      priority: searchParams.get('priority') || undefined,
      flashcardId: searchParams.get('flashcardId') || undefined,
      deckId: searchParams.get('deckId') || undefined,
      classId: searchParams.get('classId') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    };

    const validatedParams = feedbackQuerySchema.parse(queryParams);

    // 3. Build where conditions
    const conditions: SQL[] = [];

    if (validatedParams.status) {
      conditions.push(eq(userFeedback.status, validatedParams.status));
    }

    if (validatedParams.type) {
      conditions.push(eq(userFeedback.feedbackType, validatedParams.type));
    }

    if (validatedParams.priority) {
      conditions.push(eq(userFeedback.priority, validatedParams.priority));
    }

    if (validatedParams.flashcardId) {
      conditions.push(eq(userFeedback.flashcardId, validatedParams.flashcardId));
    }

    if (validatedParams.deckId) {
      conditions.push(eq(userFeedback.deckId, validatedParams.deckId));
    }

    if (validatedParams.classId) {
      conditions.push(eq(userFeedback.classId, validatedParams.classId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 4. Build order clause
    const orderByField =
      validatedParams.sortBy === 'priority'
        ? userFeedback.priority
        : validatedParams.sortBy === 'status'
        ? userFeedback.status
        : userFeedback.createdAt;

    const orderClause =
      validatedParams.sortOrder === 'asc'
        ? asc(orderByField)
        : desc(orderByField);

    // 5. Query feedback with relations
    const feedbackList = await db.query.userFeedback.findMany({
      where: whereClause,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
      orderBy: orderClause,
      with: {
        user: {
          columns: {
            clerkUserId: true,
            email: true,
            name: true,
          },
        },
        flashcard: {
          columns: {
            id: true,
            question: true,
            deckId: true,
          },
        },
        quizQuestion: {
          columns: {
            id: true,
            questionText: true,
            flashcardId: true,
          },
        },
        deckQuizQuestion: {
          columns: {
            id: true,
            questionText: true,
            deckId: true,
          },
        },
        deck: {
          columns: {
            id: true,
            name: true,
          },
        },
        class: {
          columns: {
            id: true,
            name: true,
          },
        },
        resolvedByUser: {
          columns: {
            clerkUserId: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // 6. Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(userFeedback)
      .where(whereClause);

    const total = Number(totalResult[0]?.count) || 0;

    // 7. Log successful query
    log.info('Admin feedback list retrieved', {
      filters: validatedParams,
      resultCount: feedbackList.length,
      total,
    });

    // 8. Return paginated results
    return NextResponse.json({
      success: true,
      feedback: feedbackList,
      total,
      limit: validatedParams.limit,
      offset: validatedParams.offset,
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error, 'get feedback list', {
      endpoint: '/api/admin/feedback',
      method: 'GET',
    });
  }
}

export const GET = getFeedbackList;
