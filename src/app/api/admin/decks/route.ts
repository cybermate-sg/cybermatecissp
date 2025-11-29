import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { db } from '@/lib/db';
import { decks } from '@/lib/db/schema';
import { auth } from '@clerk/nextjs/server';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

// POST /api/admin/decks - Create a new deck
async function createDeck(request: NextRequest) {
  try {
    await requireAdmin();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { classId, name, description, type, order, isPremium, isPublished } = body;

    if (!classId || !name) {
      return NextResponse.json(
        { error: 'Class ID and name are required' },
        { status: 400 }
      );
    }

    const newDeck = await db
      .insert(decks)
      .values({
        classId,
        name,
        description: description || null,
        type: type || 'flashcard',
        order: order || 0,
        isPremium: isPremium || false,
        isPublished: isPublished !== undefined ? isPublished : true,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      deck: newDeck[0],
      message: 'Deck created successfully',
    });
  } catch (error) {
    console.error('Error creating deck:', error);
    throw error;
  }
}

export const POST = withTracing(
  withErrorHandling(createDeck, 'create admin deck'),
  { logRequest: true, logResponse: false }
);

// GET /api/admin/decks - Get all decks
async function getDecks(_request: NextRequest) {
  void _request;
  try {
    await requireAdmin();

    const allDecks = await db.query.decks.findMany({
      with: {
        class: true,
      },
    });

    return NextResponse.json({ decks: allDecks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getDecks, 'get admin decks'),
  { logRequest: true, logResponse: false }
);
