import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { bookmarkedFlashcards, flashcards } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { cache } from '@/lib/redis';
import { CacheKeys, CacheTTL } from '@/lib/redis/cache-keys';
import { withErrorHandling } from '@/lib/api/error-handler';
import { withTracing } from '@/lib/middleware/with-tracing';

/**
 * GET /api/bookmarks
 * Get all bookmarked flashcards for the authenticated user
 */
async function getBookmarks(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get from cache first
    const cacheKey = CacheKeys.bookmarks.userList(userId);
    const cachedData = await cache.get<unknown[]>(cacheKey);

    if (cachedData) {
      const response = NextResponse.json({ bookmarks: cachedData, total: cachedData.length });
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Cache miss - fetch from database
    const bookmarks = await db.query.bookmarkedFlashcards.findMany({
      where: eq(bookmarkedFlashcards.clerkUserId, userId),
      orderBy: [desc(bookmarkedFlashcards.createdAt)],
      with: {
        flashcard: {
          with: {
            deck: {
              with: {
                class: true,
              },
            },
            media: true,
          },
        },
      },
    });

    // Format the response
    const formattedBookmarks = bookmarks.map((bookmark) => ({
      id: bookmark.id,
      flashcardId: bookmark.flashcardId,
      question: bookmark.flashcard.question,
      answer: bookmark.flashcard.answer,
      deckId: bookmark.flashcard.deckId,
      deckName: bookmark.flashcard.deck.name,
      classId: bookmark.flashcard.deck.classId,
      className: bookmark.flashcard.deck.class.name,
      bookmarkedAt: bookmark.createdAt,
      media: bookmark.flashcard.media.map((m) => ({
        id: m.id,
        fileUrl: m.fileUrl,
        altText: m.altText,
        placement: m.placement,
        order: m.order,
      })),
    }));

    // Store in cache
    cache.set(cacheKey, formattedBookmarks, { ttl: CacheTTL.BOOKMARKS }).catch((error) => {
      console.error('Failed to cache bookmarks:', error);
    });

    const response = NextResponse.json({ bookmarks: formattedBookmarks, total: formattedBookmarks.length });
    response.headers.set('X-Cache', 'MISS');
    return response;

  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
}

export const GET = withTracing(
  withErrorHandling(getBookmarks, 'get bookmarks'),
  { logRequest: true, logResponse: false }
);

/**
 * POST /api/bookmarks
 * Add a flashcard to bookmarks
 */
async function addBookmark(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { flashcardId } = body;

    if (!flashcardId) {
      return NextResponse.json({ error: 'flashcardId is required' }, { status: 400 });
    }

    // Check if flashcard exists
    const flashcard = await db.query.flashcards.findFirst({
      where: eq(flashcards.id, flashcardId),
    });

    if (!flashcard) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    // Check if already bookmarked
    const existingBookmark = await db.query.bookmarkedFlashcards.findFirst({
      where: and(
        eq(bookmarkedFlashcards.clerkUserId, userId),
        eq(bookmarkedFlashcards.flashcardId, flashcardId)
      ),
    });

    if (existingBookmark) {
      return NextResponse.json({
        success: true,
        bookmarked: true,
        message: 'Already bookmarked'
      });
    }

    // Create bookmark
    await db.insert(bookmarkedFlashcards).values({
      clerkUserId: userId,
      flashcardId,
    });

    // Invalidate cache
    const cachePattern = CacheKeys.bookmarks.userAll(userId);
    await cache.del(cachePattern).catch((error) => {
      console.error('Failed to invalidate bookmark cache:', error);
    });

    return NextResponse.json({
      success: true,
      bookmarked: true,
      message: 'Bookmark added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

export const POST = withTracing(
  withErrorHandling(addBookmark, 'add bookmark'),
  { logRequest: true, logResponse: false }
);
