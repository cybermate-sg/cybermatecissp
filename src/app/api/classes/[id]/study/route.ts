import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { classes, decks, flashcards, userCardProgress } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * GET /api/classes/[id]/study?mode=progressive|random|all&decks=deck1,deck2
 * Get flashcards for studying a class based on the selected mode
 * Optional: Filter by specific deck IDs (comma-separated)
 */
async function getClassStudyCards(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: classId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'progressive';
    const decksParam = searchParams.get('decks'); // Comma-separated deck IDs
    const selectedDeckIds = decksParam ? decksParam.split(',') : null;

    // Verify class exists
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Build deck query conditions
    const deckConditions = [
      eq(decks.classId, classId),
      eq(decks.isPublished, true)
    ];

    // If specific decks are selected, filter by those IDs
    if (selectedDeckIds && selectedDeckIds.length > 0) {
      deckConditions.push(inArray(decks.id, selectedDeckIds));
    }

    // Get decks (all or filtered by selection)
    const classDecks = await db.query.decks.findMany({
      where: and(...deckConditions),
      with: {
        flashcards: {
          where: eq(flashcards.isPublished, true),
          with: {
            media: true,
          },
        },
      },
    });

    if (!classDecks || classDecks.length === 0) {
      return NextResponse.json({
        flashcards: [],
        mode,
        className: classData.name,
        classId: classData.id,
      });
    }

    // Flatten all flashcards from all decks
    const allFlashcards = classDecks.flatMap(deck =>
      deck.flashcards.map(card => ({
        ...card,
        deckName: deck.name,
        className: classData.name,
      }))
    );

    if (allFlashcards.length === 0) {
      return NextResponse.json({
        flashcards: [],
        mode,
        className: classData.name,
        classId: classData.id,
      });
    }

    // Get user's progress for all cards
    const cardIds = allFlashcards.map(card => card.id);
    const progressRecords = await db
      .select()
      .from(userCardProgress)
      .where(
        and(
          eq(userCardProgress.clerkUserId, userId),
          inArray(userCardProgress.flashcardId, cardIds)
        )
      );

    // Create a map of card ID to progress
    const progressMap = new Map(
      progressRecords.map(p => [p.flashcardId, p])
    );

    // Apply study mode logic
    let studyCards = allFlashcards;

    switch (mode) {
      case 'progressive':
        // Focus on cards that need review (low confidence or due for review)
        const now = new Date();

        studyCards = allFlashcards.filter(card => {
          const progress = progressMap.get(card.id);

          // Include cards that:
          // 1. Haven't been studied yet
          if (!progress) return true;

          // 2. Have low confidence (< 4)
          if (progress.confidenceLevel !== null && progress.confidenceLevel < 4) return true;

          // 3. Are due for review
          if (progress.nextReviewDate && new Date(progress.nextReviewDate) <= now) return true;

          return false;
        });

        // Sort by: not studied > due for review > low confidence > last seen (oldest first)
        studyCards.sort((a, b) => {
          const progressA = progressMap.get(a.id);
          const progressB = progressMap.get(b.id);

          // Cards not studied come first
          if (!progressA && progressB) return -1;
          if (progressA && !progressB) return 1;
          if (!progressA && !progressB) return 0;

          // Then by confidence level (lowest first)
          const confidenceA = progressA?.confidenceLevel ?? 0;
          const confidenceB = progressB?.confidenceLevel ?? 0;
          if (confidenceA !== confidenceB) {
            return confidenceA - confidenceB;
          }

          // Then by last seen (oldest first)
          const dateA = progressA?.lastSeen ? new Date(progressA.lastSeen).getTime() : 0;
          const dateB = progressB?.lastSeen ? new Date(progressB.lastSeen).getTime() : 0;
          return dateA - dateB;
        });

        // If no cards need review, show all cards (user has mastered everything)
        if (studyCards.length === 0) {
          studyCards = allFlashcards;
        }
        break;

      case 'random':
        // Shuffle cards randomly
        studyCards = [...allFlashcards].sort(() => Math.random() - 0.5);
        break;

      case 'all':
      default:
        // Show all cards in their original order
        studyCards = allFlashcards;
        break;
    }

    return NextResponse.json({
      flashcards: studyCards,
      mode,
      className: classData.name,
      classId: classData.id,
      totalCards: allFlashcards.length,
      studyCardsCount: studyCards.length,
    });

  } catch (error) {
    console.error('Error fetching study cards:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getClassStudyCards as unknown as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'get class study cards'),
  { logRequest: true, logResponse: false }
);
