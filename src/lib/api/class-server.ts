import { auth } from '@clerk/nextjs/server';
import { cache as reactCache } from 'react';
import { db } from '@/lib/db';
import { classes, decks, flashcards, userCardProgress, deckQuizProgress, userQuizProgress } from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { cache } from '@/lib/redis';
import { CacheKeys, CacheTTL } from '@/lib/redis/cache-keys';

export type Deck = {
  id: string;
  name: string;
  description: string | null;
  type: 'flashcard' | 'quiz';
  cardCount: number;
  studiedCount: number;
  progress: number;
  quizProgress?: number; // Quiz mastery percentage
  order: number;
  domainNumber?: number | null; // CISSP domain 1-8
};

export type ClassData = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  createdBy: string;
  decks: Deck[];
};

/**
 * Server-side function to fetch class data with progress
 * This function is cached with React.cache to prevent duplicate fetches
 * within the same request (e.g., generateMetadata + page component)
 */
export const getClassWithProgress = reactCache(async (classId: string): Promise<ClassData | null> => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Try to get from Redis cache first (user-specific cache)
  const cacheKey = CacheKeys.class.details(classId, userId);

  try {
    const cachedData = await cache.get<ClassData>(cacheKey);
    if (cachedData) {
      console.log(`[Cache HIT] Class ${classId} for user ${userId}`);
      return cachedData;
    }
  } catch (error) {
    console.error('Redis cache read error:', error);
    // Continue to database fetch if cache fails
  }

  console.log(`[Cache MISS] Fetching class ${classId} from database`);

  // OPTIMIZATION: Fetch class data and prepare for progress query in parallel
  // Load only flashcard IDs to reduce memory usage (avoid loading full question/answer text)
  const classData = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
    with: {
      decks: {
        where: eq(decks.isPublished, true),
        orderBy: [asc(decks.order)],
        with: {
          flashcards: {
            where: eq(flashcards.isPublished, true),
            columns: {
              id: true, // Only load ID column to minimize memory
            },
          },
        },
      },
    },
  });

  if (!classData) {
    return null;
  }

  // Calculate progress for each deck
  // OPTIMIZATION: Fetch all user progress in a single query instead of N queries
  const allFlashcardIds = classData.decks.flatMap((deck) =>
    deck.flashcards.map((card) => card.id)
  );

  // Single batch query for all progress records (skip if no flashcards)
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

  // OPTIMIZATION: Fetch quiz progress for all decks in a single query
  const allDeckIds = classData.decks.map((deck) => deck.id);
  const deckQuizProgressRecords = allDeckIds.length > 0
    ? await db
        .select()
        .from(deckQuizProgress)
        .where(
          and(
            eq(deckQuizProgress.clerkUserId, userId),
            inArray(deckQuizProgress.deckId, allDeckIds)
          )
        )
    : [];

  // Create map for O(1) lookup of deck quiz progress
  const deckQuizMap = new Map(
    deckQuizProgressRecords.map((qp) => [
      qp.deckId,
      parseFloat(qp.masteryPercentage || '0')
    ])
  );

  // OPTIMIZATION: Fetch flashcard-level quiz progress
  const flashcardQuizRecords = allFlashcardIds.length > 0
    ? await db
        .select()
        .from(userQuizProgress)
        .where(
          and(
            eq(userQuizProgress.clerkUserId, userId),
            inArray(userQuizProgress.flashcardId, allFlashcardIds)
          )
        )
    : [];

  // Create map for O(1) lookup of flashcard quiz progress
  const flashcardQuizMap = new Map(
    flashcardQuizRecords.map((fqp) => [
      fqp.flashcardId,
      parseFloat(fqp.averageScore || '0')
    ])
  );

  // Calculate progress for each deck (now in-memory, no DB queries)
  const decksWithProgress: Deck[] = classData.decks.map((deck) => {
    const flashcardIds = deck.flashcards.map((card) => card.id);
    const totalCards = flashcardIds.length;

    // Count how many cards in this deck are studied
    const studiedCount = flashcardIds.filter((id) => studiedCardIds.has(id)).length;
    const progress = totalCards > 0 ? Math.round((studiedCount / totalCards) * 100) : 0;

    // Calculate quiz progress
    let quizProgress = 0;
    if (deck.type === 'quiz') {
      // For quiz decks, use deck-level quiz progress
      quizProgress = deckQuizMap.get(deck.id) || 0;
    } else {
      // For flashcard decks, aggregate flashcard quiz scores
      if (flashcardIds.length > 0) {
        const quizScores = flashcardIds
          .map((id) => flashcardQuizMap.get(id))
          .filter((score): score is number => score !== undefined);

        quizProgress = quizScores.length > 0
          ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
          : 0;
      }
    }

    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      type: deck.type as 'flashcard' | 'quiz',
      cardCount: totalCards,
      studiedCount,
      progress,
      quizProgress,
      order: deck.order,
      domainNumber: deck.domainNumber,
    };
  });

  const result: ClassData = {
    id: classData.id,
    name: classData.name,
    description: classData.description,
    icon: classData.icon,
    color: classData.color,
    createdBy: classData.createdBy,
    decks: decksWithProgress,
  };

  // Store in cache (fire and forget)
  try {
    await cache.set(cacheKey, result, { ttl: CacheTTL.CLASS_DETAILS });
    console.log(`[Cache SET] Cached class ${classId} for user ${userId}`);
  } catch (error) {
    console.error('Redis cache write error:', error);
    // Don't throw - cache failure shouldn't break the request
  }

  return result;
});
