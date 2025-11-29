import { cache } from './index';
import { CacheKeys } from './cache-keys';

/**
 * Cache Invalidation Utilities
 * Helper functions to invalidate related cache entries when data changes
 */

export const CacheInvalidation = {
  /**
   * Invalidate when a flashcard is created, updated, or deleted
   */
  async flashcard(flashcardId: string, deckId: string, classId: string): Promise<void> {
    const keysToDelete = [
      // Invalidate the deck's flashcards
      CacheKeys.deck.flashcards(deckId),
      // Invalidate the domain/class flashcards
      CacheKeys.domainFlashcards.all(classId),
    ];

    await cache.delMultiple(keysToDelete);

    // Invalidate all user-specific class details (using pattern)
    await cache.delPattern(CacheKeys.class.allUsers(classId));

    console.log(`Cache invalidated for flashcard ${flashcardId}`);
  },

  /**
   * Invalidate when a deck is created, updated, or deleted
   */
  async deck(deckId: string, classId: string): Promise<void> {
    const keysToDelete = [
      // Invalidate the domains list
      CacheKeys.domains.all(),
      // Invalidate the deck's flashcards
      CacheKeys.deck.flashcards(deckId),
      // Invalidate the domain/class flashcards
      CacheKeys.domainFlashcards.all(classId),
      // Invalidate deck quiz questions
      CacheKeys.deckQuiz.questions(deckId),
      CacheKeys.deckQuiz.hasQuiz(deckId),
    ];

    await cache.delMultiple(keysToDelete);

    // Invalidate all user-specific class details (using pattern)
    await cache.delPattern(CacheKeys.class.allUsers(classId));

    console.log(`Cache invalidated for deck ${deckId}`);
  },

  /**
   * Invalidate when a class is created, updated, or deleted
   */
  async class(classId: string): Promise<void> {
    const keysToDelete = [
      // Invalidate the domains list
      CacheKeys.domains.all(),
      // Invalidate the domain/class flashcards
      CacheKeys.domainFlashcards.all(classId),
    ];

    await cache.delMultiple(keysToDelete);

    // Invalidate all user-specific class details (using pattern)
    await cache.delPattern(CacheKeys.class.allUsers(classId));

    console.log(`Cache invalidated for class ${classId}`);
  },

  /**
   * Invalidate when user progress is updated
   */
  async userProgress(userId: string, flashcardId: string, classId: string): Promise<void> {
    const keysToDelete = [
      // Invalidate user's progress for this card
      CacheKeys.progress.card(userId, flashcardId),
    ];

    await cache.delMultiple(keysToDelete);

    // Invalidate user-specific class details (progress affects class view)
    await cache.delPattern(CacheKeys.class.allUsers(classId));

    console.log(`Cache invalidated for user ${userId} progress on flashcard ${flashcardId}`);
  },

  /**
   * Invalidate when deck quiz is created, updated, or deleted
   */
  async deckQuiz(deckId: string, classId: string): Promise<void> {
    const keysToDelete = [
      CacheKeys.deckQuiz.questions(deckId),
      CacheKeys.deckQuiz.hasQuiz(deckId),
      CacheKeys.deck.flashcards(deckId),
    ];

    await cache.delMultiple(keysToDelete);

    // Invalidate class details (affects deck list)
    await cache.delPattern(CacheKeys.class.allUsers(classId));

    console.log(`Cache invalidated for deck quiz ${deckId}`);
  },

  /**
   * Invalidate all cache for a specific user
   */
  async user(userId: string): Promise<void> {
    // Invalidate all user progress
    await cache.delPattern(CacheKeys.progress.userAll(userId));

    // Invalidate all class details that include this user
    await cache.delPattern(`class:*:user:${userId}`);

    console.log(`All cache invalidated for user ${userId}`);
  },

  /**
   * Invalidate everything (nuclear option - use sparingly)
   */
  async all(): Promise<void> {
    await cache.delPattern('*');
    console.log('All cache invalidated');
  },
};

/**
 * Helper function to safely invalidate cache without throwing errors
 * Useful for fire-and-forget invalidation in API routes
 */
export async function safeInvalidate(
  invalidateFn: () => Promise<void>
): Promise<void> {
  try {
    await invalidateFn();
  } catch (error) {
    console.error('Cache invalidation error:', error);
    // Don't throw - cache invalidation failures shouldn't break the request
  }
}
