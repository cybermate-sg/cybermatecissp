import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { classes, flashcards, userCardProgress } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * GET /api/progress/domain/[domainId]
 * Get user's progress statistics for a specific class (formerly domain)
 * Note: This endpoint maintains backward compatibility by using the old "domain" naming
 */
async function getDomainProgress(
  _request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const { userId } = await auth();
    const { domainId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get class with all flashcards
    const classItem = await db.query.classes.findFirst({
      where: eq(classes.id, domainId),
      with: {
        decks: {
          with: {
            flashcards: {
              where: eq(flashcards.isPublished, true),
            },
          },
        },
      },
    });

    if (!classItem) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get all flashcard IDs in this class
    const flashcardIds = classItem.decks.flatMap((deck) =>
      deck.flashcards.map((card) => card.id)
    );

    if (flashcardIds.length === 0) {
      return NextResponse.json({
        domainId,
        totalCards: 0,
        studiedCards: 0,
        masteredCards: 0,
        learningCards: 0,
        newCards: 0,
        progress: 0,
      });
    }

    // Get user's progress for all cards in this class
    const progressRecords = await db
      .select()
      .from(userCardProgress)
      .where(
        and(
          eq(userCardProgress.clerkUserId, userId),
          inArray(userCardProgress.flashcardId, flashcardIds)
        )
      );

    const studiedCards = progressRecords.length;
    const masteredCards = progressRecords.filter((p) => p.masteryStatus === 'mastered').length;
    const learningCards = progressRecords.filter((p) => p.masteryStatus === 'learning').length;
    const newCards = flashcardIds.length - studiedCards;
    const progress = flashcardIds.length > 0 ? Math.round((studiedCards / flashcardIds.length) * 100) : 0;

    return NextResponse.json({
      domainId,
      totalCards: flashcardIds.length,
      studiedCards,
      masteredCards,
      learningCards,
      newCards,
      progress,
    });

  } catch (error) {
    console.error('Error fetching domain progress:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getDomainProgress as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'get domain progress'),
  { logRequest: true, logResponse: false }
) as typeof getDomainProgress;
