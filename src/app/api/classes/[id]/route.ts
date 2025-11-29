import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { classes, decks, flashcards, userCardProgress } from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { cache } from '@/lib/redis';
import { CacheKeys, CacheTTL } from '@/lib/redis/cache-keys';
import { createApiTimer, addTimingHeaders, formatTimingLog, timeAsync } from '@/lib/api-timing';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

// GET /api/classes/:id - Get a specific class with its decks (public for logged-in users)
async function getClass(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const timer = createApiTimer('/api/classes/[id]', request.method);

  try {
    const { userId } = await auth();

    if (!userId) {
      const metrics = timer.end(401);
      console.log(formatTimingLog(metrics));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try to get from cache first (user-specific cache)
    const cacheKey = CacheKeys.class.details(id, userId);
    const cachedData = await timeAsync(
      timer,
      async () => cache.get<{
        id: string;
        name: string;
        description: string | null;
        icon: string | null;
        color: string | null;
        createdBy: string | null;
        decks: unknown[];
      }>(cacheKey),
      'cache'
    );

    if (cachedData) {
      const metrics = timer.end(200);
      console.log(formatTimingLog(metrics));
      const response = NextResponse.json(cachedData);
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return addTimingHeaders(response, metrics);
    }

    // Cache miss - fetch from database
    const classData = await timeAsync(
      timer,
      async () => db.query.classes.findFirst({
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
      }),
      'db'
    );

    if (!classData) {
      const metrics = timer.end(404);
      console.log(formatTimingLog(metrics));
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Calculate progress for each deck
    // OPTIMIZATION: Fetch all user progress in a single query instead of N queries
    const allFlashcardIds = classData.decks.flatMap((deck) =>
      deck.flashcards.map((card) => card.id)
    );

    // Single batch query for all progress records
    const allProgressRecords = allFlashcardIds.length > 0
      ? await timeAsync(
          timer,
          async () => db
            .select()
            .from(userCardProgress)
            .where(
              and(
                eq(userCardProgress.clerkUserId, userId),
                inArray(userCardProgress.flashcardId, allFlashcardIds)
              )
            ),
          'db'
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

    const responseData = {
      id: classData.id,
      name: classData.name,
      description: classData.description,
      icon: classData.icon,
      color: classData.color,
      createdBy: classData.createdBy,
      decks: decksWithProgress,
    };

    // Store in cache (fire and forget)
    cache.set(cacheKey, responseData, { ttl: CacheTTL.CLASS_DETAILS }).catch((error) => {
      console.error('Failed to cache class details:', error);
    });

    const metrics = timer.end(200);
    console.log(formatTimingLog(metrics));

    const response = NextResponse.json(responseData);
    response.headers.set('X-Cache', 'MISS');
    // Enable caching for 60 seconds with stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return addTimingHeaders(response, metrics);
  } catch (error) {
    const metrics = timer.end(500);
    console.error(formatTimingLog(metrics));
    console.error('Error fetching class:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getClass as unknown as (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'get class overview'),
  { logRequest: true, logResponse: false }
);
