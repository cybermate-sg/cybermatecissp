import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { validateGenerateRequest } from '@/lib/validations/ai-quiz';
import { createQuizGenerator } from '@/lib/ai/openrouter-client';
import { createQuotaManager } from '@/lib/ai/quota-manager';
import { db } from '@/lib/db';
import { aiQuizGenerationLog } from '@/lib/db/schema';
import { buildCisspQuizPrompt } from '@/lib/ai/prompts';
import { eq } from 'drizzle-orm';

export const maxDuration = 60; // Allow up to 60 seconds for AI generation

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Verify admin authentication
    const admin = await requireAdmin();

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = validateGenerateRequest(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { topic, generationType, customQuestionCount, targetFlashcardId, targetDeckId } =
      validation.data;
    console.log('[AI Quiz] Parsed data:', { topic, generationType, customQuestionCount });

    // 3. Initialize services
    console.log('[AI Quiz] Initializing services...');
    const quotaManager = createQuotaManager();
    const quizGenerator = createQuizGenerator();
    console.log('[AI Quiz] Services initialized');

    // 4. Check quota availability
    console.log('[AI Quiz] Checking quota for admin:', admin.clerkUserId);
    const quotaStatus = await quotaManager.checkQuota(admin.clerkUserId);
    console.log('[AI Quiz] Quota status:', quotaStatus);

    if (!quotaStatus.isEnabled) {
      return NextResponse.json(
        {
          error: 'AI quiz generation is disabled for your account',
          remainingQuota: {
            dailyUsed: quotaStatus.generationsUsedToday,
            dailyLimit: quotaStatus.quotaLimit,
            remaining: 0,
            resetTime: quotaStatus.resetTime.toISOString(),
          },
        },
        { status: 403 }
      );
    }

    if (quotaStatus.isQuotaExceeded) {
      return NextResponse.json(
        {
          error: 'Daily quota exceeded. Your quota resets at the configured time.',
          remainingQuota: {
            dailyUsed: quotaStatus.generationsUsedToday,
            dailyLimit: quotaStatus.quotaLimit,
            remaining: 0,
            resetTime: quotaStatus.resetTime.toISOString(),
          },
        },
        { status: 403 }
      );
    }

    // 5. Determine question count
    const questionCount =
      customQuestionCount ||
      (await quotaManager.getDefaultQuestionCount(admin.clerkUserId, generationType));
    console.log('[AI Quiz] Question count:', questionCount);

    // 6. Build prompt for logging
    const promptUsed = buildCisspQuizPrompt({ topic, questionCount });
    console.log('[AI Quiz] Prompt length:', promptUsed.length);

    // 7. Create initial log entry
    console.log('[AI Quiz] Creating log entry...');
    const [logEntry] = await db
      .insert(aiQuizGenerationLog)
      .values({
        adminId: admin.clerkUserId,
        flashcardId: targetFlashcardId || null,
        deckId: targetDeckId || null,
        topic,
        generationType,
        numQuestionsGenerated: 0, // Will update after generation
        promptUsed,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    console.log('[AI Quiz] Log entry created:', logEntry.id);

    try {
      // 8. Generate quiz questions using AI
      console.log('[AI Quiz] Starting AI generation...');
      const result = await quizGenerator.generateWithRetry(topic, questionCount);
      console.log('[AI Quiz] AI generation successful, questions:', result.questions.questions.length);

      // 9. Update log entry with success
      await db
        .update(aiQuizGenerationLog)
        .set({
          numQuestionsGenerated: result.questions.questions.length,
          status: 'success',
          apiResponseStatus: 200,
          tokensUsed: result.tokensUsed,
          totalCostUsd: result.costUsd.toString(),
          responseTimeMs: result.responseTimeMs,
          updatedAt: new Date(),
        })
        .where(eq(aiQuizGenerationLog.id, logEntry.id));

      // 10. Increment quota usage
      await quotaManager.incrementUsage(admin.clerkUserId);

      // 11. Get updated quota status
      const updatedQuota = await quotaManager.checkQuota(admin.clerkUserId);

      // 12. Return success response
      return NextResponse.json({
        success: true,
        data: {
          logId: logEntry.id,
          questions: result.questions,
          generationTime: result.responseTimeMs,
          tokensUsed: result.tokensUsed,
          costUsd: result.costUsd,
        },
        remainingQuota: {
          dailyUsed: updatedQuota.generationsUsedToday,
          dailyLimit: updatedQuota.quotaLimit,
          remaining: updatedQuota.remainingGenerations,
          resetTime: updatedQuota.resetTime.toISOString(),
        },
      });
      // codacy-disable-next-line Lizard_nloc-medium, Lizard_ccn-medium
    } catch (error) {
      // Handle AI generation errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode =
        error instanceof Error && 'code' in error
          ? (error as { code: string }).code
          : 'UNKNOWN';

      console.error('[AI Quiz] Generation failed:', {
        errorCode,
        errorMessage,
        error,
      });

      // Update log entry with failure
      await db
        .update(aiQuizGenerationLog)
        .set({
          status: 'failed',
          errorMessage,
          responseTimeMs: Date.now() - startTime,
          updatedAt: new Date(),
        })
        .where(eq(aiQuizGenerationLog.id, logEntry.id));

      // Return specific error based on error code
      if (errorCode === 'TIMEOUT') {
        return NextResponse.json(
          {
            error: 'AI generation timed out. Please try with fewer questions or a simpler topic.',
            code: errorCode,
          },
          { status: 504 }
        );
      }

      if (errorCode === 'VALIDATION_ERROR' || errorCode === 'PARSE_ERROR') {
        return NextResponse.json(
          {
            error: 'AI generated invalid quiz format. Please try again.',
            code: errorCode,
            details: errorMessage,
          },
          { status: 500 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          error: 'Failed to generate quiz questions. Please try again.',
          code: errorCode,
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log the full error for debugging
    console.error('AI Quiz Generation Error:', {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    // Check if it's an authentication error
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('Admin access required')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generic server error
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
