import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { classes, decks, flashcards, userCardProgress } from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';

// GET /api/classes/:id - Get a specific class with its decks (public for logged-in users)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch class data
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, id),
      with: {
        decks: {
          where: eq(decks.isPublished, true),
          orderBy: [asc(decks.order)],
          with: {
            flashcards: {
              where: eq(flashcards.isPublished, true),
            },
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Calculate progress for each deck
    // OPTIMIZATION: Fetch all user progress in a single query instead of N queries
    const allFlashcardIds = classData.decks.flatMap((deck) =>
      deck.flashcards.map((card) => card.id)
    );

    // Single batch query for all progress records
    const allProgressRecords = allFlashcardIds.length > 0
      ? await db
          .select()
          .from(userCardProgress)
          .where(
            and(
              eq(userCardProgress.clerkUserId, userId),
              inArray(userCardProgress.flashcardId, allFlashcardIds)
            )
          )
      : [];

    // Create a Set for O(1) lookup
    const studiedCardIds = new Set(allProgressRecords.map((record) => record.flashcardId));

    // Calculate progress for each deck (now in-memory, no DB queries)
    const decksWithProgress = classData.decks.map((deck) => {
      const flashcardIds = deck.flashcards.map((card) => card.id);
      const totalCards = flashcardIds.length;

      // Count how many cards in this deck are studied
      const studiedCount = flashcardIds.filter((id) => studiedCardIds.has(id)).length;
      const progress = totalCards > 0 ? Math.round((studiedCount / totalCards) * 100) : 0;

      return {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        cardCount: totalCards,
        studiedCount,
        progress,
        order: deck.order,
      };
    });

    const response = NextResponse.json({
      id: classData.id,
      name: classData.name,
      description: classData.description,
      icon: classData.icon,
      color: classData.color,
      createdBy: classData.createdBy,
      decks: decksWithProgress,
    });

    // Enable caching for 60 seconds with stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error('Error fetching class:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch class';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
