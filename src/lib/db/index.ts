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
// Xata has a concurrent connection limit, so we use a small pool
const client = postgres(connectionString, {
  prepare: false,
  max: 1, // Xata free tier has strict connection limits
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
});

// Drizzle instance optimized for PostgreSQL
// Works seamlessly with Xata.io, Vercel Postgres, Neon, or any PostgreSQL compatible service
export const db = drizzle(client, { schema });

// Export types
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Subscription = typeof schema.subscriptions.$inferSelect;
export type NewSubscription = typeof schema.subscriptions.$inferInsert;

export type Payment = typeof schema.payments.$inferSelect;
export type NewPayment = typeof schema.payments.$inferInsert;

export type Domain = typeof schema.domains.$inferSelect;
export type NewDomain = typeof schema.domains.$inferInsert;

export type Topic = typeof schema.topics.$inferSelect;
export type NewTopic = typeof schema.topics.$inferInsert;

export type Deck = typeof schema.decks.$inferSelect;
export type NewDeck = typeof schema.decks.$inferInsert;

export type Flashcard = typeof schema.flashcards.$inferSelect;
export type NewFlashcard = typeof schema.flashcards.$inferInsert;

export type UserCardProgress = typeof schema.userCardProgress.$inferSelect;
export type NewUserCardProgress = typeof schema.userCardProgress.$inferInsert;

export type StudySession = typeof schema.studySessions.$inferSelect;
export type NewStudySession = typeof schema.studySessions.$inferInsert;

export type SessionCard = typeof schema.sessionCards.$inferSelect;
export type NewSessionCard = typeof schema.sessionCards.$inferInsert;

export type DeckProgress = typeof schema.deckProgress.$inferSelect;
export type NewDeckProgress = typeof schema.deckProgress.$inferInsert;

export type UserStats = typeof schema.userStats.$inferSelect;
export type NewUserStats = typeof schema.userStats.$inferInsert;
