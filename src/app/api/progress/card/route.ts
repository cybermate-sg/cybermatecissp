import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userCardProgress, flashcards, sessionCards, users, subscriptions, userStats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { CacheInvalidation, safeInvalidate } from '@/lib/redis/invalidation';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * Ensure user exists in database, create if not
 */
async function ensureUserExists(userId: string) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  });

  if (!existingUser) {
    // User doesn't exist, create them (webhook might have failed)
    const clerkUser = await currentUser();

    if (!clerkUser) {
      throw new Error('Unable to fetch user from Clerk');
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;

    try {
      // Create user
      await db.insert(users).values({
        clerkUserId: userId,
        email: email!,
        name,
        role: 'user',
      });

      // Create free subscription
      await db.insert(subscriptions).values({
        clerkUserId: userId,
        planType: 'free',
        status: 'active',
      });

      // Initialize user stats
      await db.insert(userStats).values({
        clerkUserId: userId,
        totalCardsStudied: 0,
        studyStreakDays: 0,
        totalStudyTime: 0,
        dailyCardsStudiedToday: 0,
      });

      console.log('User auto-created:', userId);
    } catch (error) {
      console.error('Error auto-creating user:', error);
      throw error;
    }
  }
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

    if (existingProgress) {
      // Update existing progress
      const newTimesSeen = (existingProgress.timesSeen || 0) + 1;
      const newMasteryStatus = confidenceLevel >= 4 ? 'mastered' : confidenceLevel >= 3 ? 'learning' : 'new';

      // Calculate next review date based on confidence level (spaced repetition)
      const now = new Date();
      const daysUntilReview = confidenceLevel === 5 ? 7 : confidenceLevel === 4 ? 3 : confidenceLevel === 3 ? 1 : 0.5;
      const nextReviewDate = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000);

      [progress] = await db
        .update(userCardProgress)
        .set({
          confidenceLevel,
          timesSeen: newTimesSeen,
          lastSeen: now,
          nextReviewDate,
          masteryStatus: newMasteryStatus as 'new' | 'learning' | 'mastered',
          updatedAt: now,
        })
        .where(eq(userCardProgress.id, existingProgress.id))
        .returning();

    } else {
      // Create new progress record
      const now = new Date();
      const daysUntilReview = confidenceLevel === 5 ? 7 : confidenceLevel === 4 ? 3 : confidenceLevel === 3 ? 1 : 0.5;
      const nextReviewDate = new Date(now.getTime() + daysUntilReview * 24 * 60 * 60 * 1000);
      const masteryStatus = confidenceLevel >= 4 ? 'mastered' : confidenceLevel >= 3 ? 'learning' : 'new';

      [progress] = await db
        .insert(userCardProgress)
        .values({
          clerkUserId: userId,
          flashcardId,
          confidenceLevel,
          timesSeen: 1,
          lastSeen: now,
          nextReviewDate,
          masteryStatus: masteryStatus as 'new' | 'learning' | 'mastered',
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
