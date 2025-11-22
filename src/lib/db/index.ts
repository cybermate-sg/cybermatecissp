import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use DATABASE_URL (supports Xata, Neon, Vercel Postgres, or any PostgreSQL)
// Xata connection string format: postgresql://[workspace]:[api-key]@[region].sql.xata.sh/[database]:[branch]
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// During Next.js build, we don't need a real database connection
// Use a dummy connection string for build-time type checking
const isNextBuild = process.argv.includes('build') || process.env.NEXT_PHASE === 'phase-production-build';
const effectiveConnectionString = connectionString || (isNextBuild ? 'postgresql://dummy:dummy@localhost:5432/dummy' : '');

if (!effectiveConnectionString && !isNextBuild) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
}

// Create postgres client with connection pooling for Xata
// PERFORMANCE OPTIMIZATION: Increased pool size and optimized timeouts for better throughput
const client = postgres(effectiveConnectionString!, {
  prepare: false,
  max: 10, // Increased from 5 to handle more concurrent requests (reduces queue time)
  idle_timeout: 30, // Increased from 20s to keep warm connections longer
  max_lifetime: 60 * 10, // Increased to 10 minutes to reduce reconnection overhead
  connect_timeout: 30, // Increased to 30s to allow for slower initial connections
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
 * @param options - Configuration options
 * @returns The result of the database query
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    queryName?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, queryName = 'unknown-query' } = options;

  let lastError: Error | unknown;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStartTime = Date.now();

    try {
      const result = await fn();

      // Log successful query metrics
      const duration = Date.now() - startTime;
      const attemptDuration = Date.now() - attemptStartTime;

      if (attempt > 1 || duration > 5000) {
        console.log(`[DB Success] "${queryName}" completed in ${duration}ms (attempt ${attempt}/${maxRetries}, last attempt: ${attemptDuration}ms)`);
      }

      return result;
    } catch (error) {
      lastError = error;
      const err = error as Error & { code?: string };
      const attemptDuration = Date.now() - attemptStartTime;

      // Log detailed error information
      console.error(`[DB Error] Attempt ${attempt}/${maxRetries} for "${queryName}" failed after ${attemptDuration}ms:`, {
        errorCode: err?.code,
        errorMessage: err?.message,
        errorType: err?.constructor?.name,
        fullError: error, // Log the full error object
        errorStack: err?.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
      });

      // Check if error is retryable (connection/timeout errors)
      const isRetryable =
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'ENOTFOUND' ||
        err?.code === 'ECONNRESET' ||
        err?.message?.includes('CONNECT_TIMEOUT') ||
        err?.message?.includes('Connection terminated') ||
        err?.message?.includes('Connection closed') ||
        err?.message?.includes('unexpected EOF') ||
        err?.message?.includes('receive message failed') ||
        err?.message?.includes('timeout');

      // Don't retry if it's not a connection error or if we've exhausted retries
      if (!isRetryable || attempt === maxRetries) {
        const totalDuration = Date.now() - startTime;
        console.error(`[DB Failed] "${queryName}" failed permanently after ${totalDuration}ms and ${attempt} attempts:`, {
          finalError: err?.message,
          isRetryable,
        });
        throw error;
      }

      // Exponential backoff
      const delay = delayMs * attempt;
      console.warn(`[DB Retry] Retrying "${queryName}" in ${delay}ms (attempt ${attempt + 1}/${maxRetries})...`);
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
