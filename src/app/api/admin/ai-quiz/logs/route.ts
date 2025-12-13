import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { aiQuizGenerationLog, users } from '@/lib/db/schema';
import { desc, eq, and, gte, lte, sql, count } from 'drizzle-orm';

/**
 * GET /api/admin/ai-quiz/logs
 * Get AI quiz generation logs with pagination and filtering
 *
 * Query parameters:
 * - limit: number (default 50, max 500)
 * - offset: number (default 0)
 * - status: 'all' | 'success' | 'failed' | 'pending' | 'partial'
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await requireAdmin();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const statusFilter = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const conditions = [eq(aiQuizGenerationLog.adminId, admin.clerkUserId)];

    // Add status filter
    if (statusFilter !== 'all') {
      conditions.push(eq(aiQuizGenerationLog.status, statusFilter));
    }

    // Add date range filters
    if (startDate) {
      conditions.push(gte(aiQuizGenerationLog.createdAt, new Date(startDate)));
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of day
      conditions.push(lte(aiQuizGenerationLog.createdAt, endDateTime));
    }

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(aiQuizGenerationLog)
      .where(and(...conditions));

    const totalCount = totalCountResult?.count || 0;

    // Fetch logs with pagination
    const logs = await db
      .select()
      .from(aiQuizGenerationLog)
      .where(and(...conditions))
      .orderBy(desc(aiQuizGenerationLog.createdAt))
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      flashcardId: log.flashcardId,
      deckId: log.deckId,
      topic: log.topic,
      generationType: log.generationType,
      numQuestionsGenerated: log.numQuestionsGenerated,
      status: log.status,
      errorMessage: log.errorMessage,
      tokensUsed: log.tokensUsed,
      costUsd: log.totalCostUsd,
      responseTimeMs: log.responseTimeMs,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch generation logs',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
