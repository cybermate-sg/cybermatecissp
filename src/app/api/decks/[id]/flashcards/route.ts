import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { decks, flashcards, flashcardMedia } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { cache } from '@/lib/redis';
import { CacheKeys, CacheTTL } from '@/lib/redis/cache-keys';

/**
 * GET /api/decks/[id]/flashcards
 * Get all flashcards for a specific deck
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try to get from cache first
    const cacheKey = CacheKeys.deck.flashcards(id);
    const cachedData = await cache.get<{
      deck: {
        id: string;
        name: string;
        description: string | null;
        classId: string;
        className: string;
      };
      flashcards: unknown[];
      total: number;
    }>(cacheKey);

    if (cachedData) {
      const response = NextResponse.json(cachedData);
      response.headers.set('X-Cache', 'HIT');
      // Reduce cache duration to 10 seconds to show updates faster
      // Use must-revalidate to ensure fresh data after cache expires
      response.headers.set('Cache-Control', 'public, s-maxage=10, must-revalidate');
      return response;
    }

    // Cache miss - fetch from database
    const deck = await db.query.decks.findFirst({
      where: and(
        eq(decks.id, id),
        eq(decks.isPublished, true)
      ),
      with: {
        class: true,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Get all published flashcards for this deck with media
    const deckFlashcards = await db.query.flashcards.findMany({
      where: and(
        eq(flashcards.deckId, id),
        eq(flashcards.isPublished, true)
      ),
      orderBy: [asc(flashcards.order)],
      with: {
        media: {
          orderBy: [asc(flashcardMedia.order)],
        },
      },
    });

    // Format the response
    const formattedFlashcards = deckFlashcards.map((card) => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      explanation: card.explanation,
      deckName: deck.name,
      className: deck.class.name,
      media: card.media.map((m) => ({
        id: m.id,
        fileUrl: m.fileUrl,
        altText: m.altText,
        placement: m.placement,
        order: m.order,
      })),
    }));

    const responseData = {
      deck: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        classId: deck.classId,
        className: deck.class.name,
      },
      flashcards: formattedFlashcards,
      total: formattedFlashcards.length,
    };

    // Store in cache (fire and forget)
    cache.set(cacheKey, responseData, { ttl: CacheTTL.FLASHCARDS }).catch((error) => {
      console.error('Failed to cache deck flashcards:', error);
    });

    const response = NextResponse.json(responseData);
    response.headers.set('X-Cache', 'MISS');
    // Reduce cache duration to 10 seconds to show updates faster
    // Use must-revalidate to ensure fresh data after cache expires
    response.headers.set('Cache-Control', 'public, s-maxage=10, must-revalidate');
    return response;

  } catch (error) {
    console.error('Error fetching deck flashcards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch flashcards';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
