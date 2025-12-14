import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { validateQuotaConfigUpdate } from '@/lib/validations/ai-quiz';
import { createQuotaManager } from '@/lib/ai/quota-manager';
import { db } from '@/lib/db';
import { aiQuizGenerationLog } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * GET /api/admin/ai-quiz/quota
 * Get current quota status and recent generation history
 */
export async function GET() {
  try {
    // Verify admin authentication
    const admin = await requireAdmin();

    // Initialize quota manager
    const quotaManager = createQuotaManager();

    // Get quota status
    const quotaStatus = await quotaManager.checkQuota(admin.clerkUserId);

    // Get configuration
    const config = await quotaManager.getOrCreateConfig(admin.clerkUserId);

    // Get recent generation logs (last 10)
    const recentGenerations = await db
      .select()
      .from(aiQuizGenerationLog)
      .where(eq(aiQuizGenerationLog.adminId, admin.clerkUserId))
      .orderBy(desc(aiQuizGenerationLog.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        adminId: admin.clerkUserId,
        dailyQuotaLimit: quotaStatus.quotaLimit,
        generationsUsedToday: quotaStatus.generationsUsedToday,
        remainingGenerations: quotaStatus.remainingGenerations,
        isQuotaExceeded: quotaStatus.isQuotaExceeded,
        resetTime: quotaStatus.resetTime.toISOString(),
        config: {
          flashcardQuestionsDefault: config.flashcardQuestionsDefault,
          deckQuestionsDefault: config.deckQuestionsDefault,
          quotaResetHour: config.quotaResetHour,
          isEnabled: config.isEnabled,
          notes: config.notes,
        },
        // codacy-disable-next-line Lizard_parameter-count-medium
        recentGenerations: recentGenerations.map((log) => ({
          id: log.id,
          topic: log.topic,
          generationType: log.generationType,
          numQuestionsGenerated: log.numQuestionsGenerated,
          status: log.status,
          errorMessage: log.errorMessage,
          tokensUsed: log.tokensUsed,
          costUsd: log.totalCostUsd,
          responseTimeMs: log.responseTimeMs,
          createdAt: log.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch quota information',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/ai-quiz/quota
 * Update quota configuration
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await requireAdmin();

    // Parse and validate request body
    const body = await request.json();
    const validation = validateQuotaConfigUpdate(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Initialize quota manager
    const quotaManager = createQuotaManager();

    // Update configuration
    await quotaManager.updateConfig(admin.clerkUserId, validation.data);

    // Get updated configuration
    const updatedConfig = await quotaManager.getOrCreateConfig(admin.clerkUserId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Quota configuration updated successfully',
        config: {
          dailyQuotaLimit: updatedConfig.dailyQuotaLimit,
          flashcardQuestionsDefault: updatedConfig.flashcardQuestionsDefault,
          deckQuestionsDefault: updatedConfig.deckQuestionsDefault,
          quotaResetHour: updatedConfig.quotaResetHour,
          isEnabled: updatedConfig.isEnabled,
          notes: updatedConfig.notes,
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
        error: 'Failed to update quota configuration',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
