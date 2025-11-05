import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use DATABASE_URL (supports Xata, Neon, Vercel Postgres, or any PostgreSQL)
// Xata connection string format: postgresql://[workspace]:[api-key]@[region].sql.xata.sh/[database]:[branch]
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
}

// Create postgres client with connection pooling for Xata
// Optimized for Xata free tier memory constraints
const client = postgres(connectionString, {
  prepare: false,
  max: 5, // Increased slightly from 2 to handle concurrent requests better
  idle_timeout: 20, // Release idle connections after 20 seconds
  max_lifetime: 60 * 5, // 5 minutes max lifetime
  connect_timeout: 30, // Connection timeout increased to 30 seconds for cold starts
  timeout: 25, // Query timeout (25 seconds) to prevent long-running queries
  fetch_types: false, // Disable type fetching to reduce memory
  onnotice: () => {}, // Suppress notices
  connection: {
    application_name: 'cisspmastery', // Add application name for better monitoring
  },
});

// Drizzle instance optimized for PostgreSQL
// Works seamlessly with Xata.io, Vercel Postgres, Neon, or any PostgreSQL compatible service
export const db = drizzle(client, { schema });

/**
 * Retry wrapper for database queries to handle transient connection errors
 * @param fn - The database query function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Initial delay between retries in milliseconds (default: 1000)
 * @returns The result of the database query
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable (connection/timeout errors)
      const isRetryable =
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENOTFOUND' ||
        error?.message?.includes('CONNECT_TIMEOUT') ||
        error?.message?.includes('Connection terminated') ||
        error?.message?.includes('Connection closed');

      // Don't retry if it's not a connection error or if we've exhausted retries
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = delayMs * attempt;
      console.warn(`[DB Retry] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Export types
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Subscription = typeof schema.subscriptions.$inferSelect;
export type NewSubscription = typeof schema.subscriptions.$inferInsert;

export type Payment = typeof schema.payments.$inferSelect;
export type NewPayment = typeof schema.payments.$inferInsert;

export type Class = typeof schema.classes.$inferSelect;
export type NewClass = typeof schema.classes.$inferInsert;

export type Deck = typeof schema.decks.$inferSelect;
export type NewDeck = typeof schema.decks.$inferInsert;

export type Flashcard = typeof schema.flashcards.$inferSelect;
export type NewFlashcard = typeof schema.flashcards.$inferInsert;

export type FlashcardMedia = typeof schema.flashcardMedia.$inferSelect;
export type NewFlashcardMedia = typeof schema.flashcardMedia.$inferInsert;

export type UserCardProgress = typeof schema.userCardProgress.$inferSelect;
export type NewUserCardProgress = typeof schema.userCardProgress.$inferInsert;

export type StudySession = typeof schema.studySessions.$inferSelect;
export type NewStudySession = typeof schema.studySessions.$inferInsert;

export type SessionCard = typeof schema.sessionCards.$inferSelect;
export type NewSessionCard = typeof schema.sessionCards.$inferInsert;

export type DeckProgress = typeof schema.deckProgress.$inferSelect;
export type NewDeckProgress = typeof schema.deckProgress.$inferInsert;

export type ClassProgress = typeof schema.classProgress.$inferSelect;
export type NewClassProgress = typeof schema.classProgress.$inferInsert;

export type UserStats = typeof schema.userStats.$inferSelect;
export type NewUserStats = typeof schema.userStats.$inferInsert;
