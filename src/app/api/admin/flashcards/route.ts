import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { flashcards, decks, flashcardMedia, quizQuestions } from '@/lib/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { CacheInvalidation, safeInvalidate } from '@/lib/redis/invalidation';
import { validateQuizFile } from '@/lib/validations/quiz';

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

    const query = db.query.flashcards.findMany({
      orderBy: [desc(flashcards.createdAt)],
      limit,
      offset,
      with: {
        deck: {
          with: {
            class: true, // Changed from topic.domain to class
          },
        },
        media: {
          orderBy: [asc(flashcardMedia.order)],
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
        with: {
          media: {
            orderBy: [asc(flashcardMedia.order)],
          },
        },
      });

      return NextResponse.json({ flashcards: cards, total: cards.length });
    }

    const allFlashcards = await query;

    return NextResponse.json({
      flashcards: allFlashcards,
      total: allFlashcards.length,
    });

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch flashcards';
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('Unauthorized') ? 403 : 500 }
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
    const { deckId, question, answer, explanation, order, isPublished, media, quizData } = body;

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
        order: cardOrder,
        isPublished: isPublished !== undefined ? isPublished : true,
        createdBy: admin.clerkUserId,
      })
      .returning();

    // Insert media if provided
    if (media && Array.isArray(media) && media.length > 0) {
      await db.insert(flashcardMedia).values(
        media.map((m: {
          url: string;
          key: string;
          fileName: string;
          fileSize: number;
          mimeType: string;
          placement: string;
          order: number;
          altText?: string;
        }) => ({
          flashcardId: flashcard.id,
          fileUrl: m.url,
          fileKey: m.key,
          fileName: m.fileName,
          fileSize: m.fileSize,
          mimeType: m.mimeType,
          placement: m.placement,
          order: m.order,
          altText: m.altText || null,
        }))
      );
    }

    // Insert quiz questions if provided
    if (quizData) {
      // Validate quiz data
      const validationResult = validateQuizFile(quizData);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: `Invalid quiz data: ${validationResult.error}` },
          { status: 400 }
        );
      }

      // Insert quiz questions
      if (validationResult.data.questions.length > 0) {
        await db.insert(quizQuestions).values(
          validationResult.data.questions.map((q, index) => ({
            flashcardId: flashcard.id,
            questionText: q.question,
            options: q.options, // Store as JSON
            explanation: q.explanation || null,
            order: index,
            createdBy: admin.clerkUserId,
          }))
        );
      }
    }

    // Update deck card count
    await db
      .update(decks)
      .set({
        cardCount: deck.cardCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(decks.id, deckId));

    // Fetch the complete flashcard with media
    const completeFlashcard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, flashcard.id),
      with: {
        media: {
          orderBy: [asc(flashcardMedia.order)],
        },
      },
    });

    // Invalidate related cache entries
    await safeInvalidate(() =>
      CacheInvalidation.flashcard(flashcard.id, deckId, deck.classId)
    );

    return NextResponse.json({
      success: true,
      flashcard: completeFlashcard,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating flashcard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create flashcard';
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
