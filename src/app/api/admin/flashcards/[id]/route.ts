import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { flashcards, decks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/admin/flashcards/[id]
 * Update a flashcard (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { question, answer, explanation, difficulty, order, isPublished } = body;

    // Check if flashcard exists
    const existingCard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, id),
    });

    if (!existingCard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    // Update flashcard
    const [updatedCard] = await db
      .update(flashcards)
      .set({
        question: question !== undefined ? question : existingCard.question,
        answer: answer !== undefined ? answer : existingCard.answer,
        explanation: explanation !== undefined ? explanation : existingCard.explanation,
        difficulty: difficulty !== undefined ? difficulty : existingCard.difficulty,
        order: order !== undefined ? order : existingCard.order,
        isPublished: isPublished !== undefined ? isPublished : existingCard.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(flashcards.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      flashcard: updatedCard,
    });

  } catch (error: any) {
    console.error('Error updating flashcard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update flashcard' },
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/admin/flashcards/[id]
 * Delete a flashcard (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if flashcard exists
    const existingCard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, id),
    });

    if (!existingCard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    // Delete flashcard
    await db.delete(flashcards).where(eq(flashcards.id, id));

    // Update deck card count
    const deck = await db.query.decks.findFirst({
      where: eq(decks.id, existingCard.deckId),
    });

    if (deck) {
      await db
        .update(decks)
        .set({
          cardCount: Math.max(0, deck.cardCount - 1),
          updatedAt: new Date(),
        })
        .where(eq(decks.id, deck.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Flashcard deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete flashcard' },
      { status: error.message?.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
