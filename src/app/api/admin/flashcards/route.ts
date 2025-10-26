import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { flashcards, decks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/admin/flashcards
 * Get all flashcards (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const deckId = searchParams.get('deckId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.query.flashcards.findMany({
      orderBy: [desc(flashcards.createdAt)],
      limit,
      offset,
      with: {
        deck: {
          with: {
            topic: {
              with: {
                domain: true,
              },
            },
          },
        },
      },
    });

    // Filter by deck if specified
    if (deckId) {
      const cards = await db.query.flashcards.findMany({
        where: eq(flashcards.deckId, deckId),
        orderBy: [desc(flashcards.order)],
        limit,
        offset,
      });

      return NextResponse.json({ flashcards: cards, total: cards.length });
    }

    const allFlashcards = await query;

    return NextResponse.json({
      flashcards: allFlashcards,
      total: allFlashcards.length,
    });

  } catch (error: any) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch flashcards' },
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * POST /api/admin/flashcards
 * Create new flashcard (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const { deckId, question, answer, explanation, difficulty, order, isPublished } = body;

    if (!deckId || !question || !answer) {
      return NextResponse.json(
        { error: 'deckId, question, and answer are required' },
        { status: 400 }
      );
    }

    // Verify deck exists
    const deck = await db.query.decks.findFirst({
      where: eq(decks.id, deckId),
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Get the next order number if not provided
    let cardOrder = order;
    if (cardOrder === undefined) {
      const lastCard = await db.query.flashcards.findFirst({
        where: eq(flashcards.deckId, deckId),
        orderBy: [desc(flashcards.order)],
      });
      cardOrder = (lastCard?.order || 0) + 1;
    }

    // Create flashcard
    const [flashcard] = await db
      .insert(flashcards)
      .values({
        deckId,
        question,
        answer,
        explanation: explanation || null,
        difficulty: difficulty || 3,
        order: cardOrder,
        isPublished: isPublished !== undefined ? isPublished : true,
        createdBy: admin.clerkUserId,
      })
      .returning();

    // Update deck card count
    await db
      .update(decks)
      .set({
        cardCount: deck.cardCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(decks.id, deckId));

    return NextResponse.json({
      success: true,
      flashcard,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating flashcard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create flashcard' },
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
