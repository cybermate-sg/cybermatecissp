import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { decks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/decks/:id - Get a specific deck
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const deck = await db.query.decks.findFirst({
      where: eq(decks.id, id),
      with: {
        class: true,
        flashcards: {
          with: {
            media: true,
            quizQuestions: true,
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error fetching deck:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch deck';
    return NextResponse.json(
      { error: message },
      { status: message?.includes('admin') ? 403 : 500 }
    );
  }
}

// PUT /api/admin/decks/:id - Update a deck
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const { name, description, order, isPremium, isPublished } = body;

    const updatedDeck = await db
      .update(decks)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(isPremium !== undefined && { isPremium }),
        ...(isPublished !== undefined && { isPublished }),
        updatedAt: new Date(),
      })
      .where(eq(decks.id, id))
      .returning();

    if (!updatedDeck.length) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json({
      deck: updatedDeck[0],
      message: 'Deck updated successfully',
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    const message = error instanceof Error ? error.message : 'Failed to update deck';
    return NextResponse.json(
      { error: message },
      { status: message?.includes('admin') ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/decks/:id - Delete a deck
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if deck exists
    const deck = await db
      .select()
      .from(decks)
      .where(eq(decks.id, id))
      .limit(1);

    if (!deck.length) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Delete deck (cascades to flashcards)
    await db.delete(decks).where(eq(decks.id, id));

    return NextResponse.json({
      message: 'Deck deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting deck:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete deck';
    return NextResponse.json(
      { error: message },
      { status: message?.includes('admin') ? 403 : 500 }
    );
  }
}
