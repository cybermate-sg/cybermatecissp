import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userCardProgress, flashcards, sessionCards } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { CacheInvalidation, safeInvalidate } from '@/lib/redis/invalidation';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';
import { ensureUserExists } from '@/lib/db/ensure-user';

/**
 * Calculate mastery status based on confidence level
 */
function calculateMasteryStatus(confidenceLevel: number): 'new' | 'learning' | 'mastered' {
  if (confidenceLevel >= 4) return 'mastered';
  if (confidenceLevel >= 3) return 'learning';
  return 'new';
}

/**
 * Calculate next review date based on confidence level (spaced repetition)
 */
function calculateNextReviewDate(confidenceLevel: number): Date {
  const now = new Date();
  let daysUntilReview: number;

  if (confidenceLevel === 5) {
    daysUntilReview = 7;
  } else if (confidenceLevel === 4) {
    daysUntilReview = 3;
  } else if (confidenceLevel === 3) {
    daysUntilReview = 1;
  } else {
    daysUntilReview = 0.5;
  }

  return new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000);
}

/**
 * POST /api/progress/card
 * Save or update user's progress on a specific flashcard
 */
async function saveCardProgress(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user exists in database
    await ensureUserExists(userId);

    const body = await request.json();
    const { flashcardId, confidenceLevel, sessionId } = body;

    if (!flashcardId || confidenceLevel === undefined) {
      return NextResponse.json(
        { error: 'flashcardId and confidenceLevel are required' },
        { status: 400 }
      );
    }

    if (confidenceLevel < 1 || confidenceLevel > 5) {
      return NextResponse.json(
        { error: 'confidenceLevel must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if flashcard exists and get deck info for cache invalidation
    const flashcard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, flashcardId),
      with: {
        deck: true,
      },
    });

    if (!flashcard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    // Check if user already has progress for this card
    const existingProgress = await db.query.userCardProgress.findFirst({
      where: and(
        eq(userCardProgress.clerkUserId, userId),
        eq(userCardProgress.flashcardId, flashcardId)
      ),
    });

    let progress;

    const now = new Date();
    const masteryStatus = calculateMasteryStatus(confidenceLevel);
    const nextReviewDate = calculateNextReviewDate(confidenceLevel);

    if (existingProgress) {
      // Update existing progress
      const newTimesSeen = (existingProgress.timesSeen || 0) + 1;

      [progress] = await db
        .update(userCardProgress)
        .set({
          confidenceLevel,
          timesSeen: newTimesSeen,
          lastSeen: now,
          nextReviewDate,
          masteryStatus,
          updatedAt: now,
        })
        .where(eq(userCardProgress.id, existingProgress.id))
        .returning();

    } else {
      // Create new progress record
      [progress] = await db
        .insert(userCardProgress)
        .values({
          clerkUserId: userId,
          flashcardId,
          confidenceLevel,
          timesSeen: 1,
          lastSeen: now,
          nextReviewDate,
          masteryStatus,
        })
        .returning();
    }

    // If sessionId provided, also record in session_cards
    if (sessionId) {
      await db.insert(sessionCards).values({
        sessionId,
        flashcardId,
        confidenceRating: confidenceLevel,
      });
    }

    // Invalidate related cache entries
    await safeInvalidate(() =>
      CacheInvalidation.userProgress(userId, flashcardId, flashcard.deck.classId)
    );

    return NextResponse.json({
      success: true,
      progress,
    });

  } catch (error) {
    console.error('Error saving card progress:', error);
    throw error;
  }
}

export const POST = withTracing(
  withErrorHandling(saveCardProgress, 'save card progress'),
  { logRequest: true, logResponse: false }
);

/**
 * GET /api/progress/card?flashcardId=xxx
 * Get user's progress for a specific flashcard
 */
async function getCardProgress(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const flashcardId = searchParams.get('flashcardId');

    if (!flashcardId) {
      return NextResponse.json(
        { error: 'flashcardId query parameter is required' },
        { status: 400 }
      );
    }

    const progress = await db.query.userCardProgress.findFirst({
      where: and(
        eq(userCardProgress.clerkUserId, userId),
        eq(userCardProgress.flashcardId, flashcardId)
      ),
    });

    return NextResponse.json({ progress: progress || null });

  } catch (error) {
    console.error('Error fetching card progress:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getCardProgress, 'get card progress'),
  { logRequest: true, logResponse: false }
);
