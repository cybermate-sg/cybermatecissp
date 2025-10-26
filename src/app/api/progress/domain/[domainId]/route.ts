import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { domains, topics, decks, flashcards, userCardProgress } from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

/**
 * GET /api/progress/domain/[domainId]
 * Get user's progress statistics for a specific domain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const { userId } = await auth();
    const { domainId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get domain with all flashcards
    const domain = await db.query.domains.findFirst({
      where: eq(domains.id, domainId),
      with: {
        topics: {
          with: {
            decks: {
              with: {
                flashcards: {
                  where: eq(flashcards.isPublished, true),
                },
              },
            },
          },
        },
      },
    });

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Get all flashcard IDs in this domain
    const flashcardIds = domain.topics.flatMap((topic) =>
      topic.decks.flatMap((deck) => deck.flashcards.map((card) => card.id))
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

    // Get user's progress for all cards in this domain
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
    return NextResponse.json(
      { error: 'Failed to fetch domain progress' },
      { status: 500 }
    );
  }
}
