import { pgTable, text, integer, timestamp, boolean, varchar, uuid, decimal, pgEnum, index, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const planTypeEnum = pgEnum('plan_type', ['free', 'pro_monthly', 'pro_yearly', 'lifetime']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'trialing', 'inactive']);
export const masteryStatusEnum = pgEnum('mastery_status', ['new', 'learning', 'mastered']);
export const paymentStatusEnum = pgEnum('payment_status', ['succeeded', 'failed', 'pending']);

// ============================================
// AUTHENTICATION & BILLING TABLES
// ============================================

// Users table (synced from Clerk)
export const users = pgTable('users', {
  clerkUserId: varchar('clerk_user_id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  linkedinId: varchar('linkedin_id', { length: 255 }),
  role: userRoleEnum('role').notNull().default('user'), // Only admins can create classes/decks/cards
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  planType: planTypeEnum('plan_type').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('inactive'),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }).notNull(),
  amount: integer('amount').notNull(), // in cents
  currency: varchar('currency', { length: 3 }).notNull().default('usd'),
  status: paymentStatusEnum('status').notNull(),
  paymentMethod: varchar('payment_method', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// BRAINSCAPE MODEL: CLASSES → DECKS → CARDS
// ADMIN-ONLY CREATION / USER CONSUMPTION
// ============================================

// Classes table - Top level organization (like "CISSP Mastery", "AWS Certification", etc.)
// ✅ ADMIN CREATES ONLY
export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  icon: varchar('icon', { length: 100 }), // emoji or icon name
  color: varchar('color', { length: 50 }), // For UI theming (e.g., 'purple', 'blue')
  isPublished: boolean('is_published').default(true), // Admins can draft classes
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.clerkUserId), // Admin who created it
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Decks table - Collections of flashcards within a class
// ✅ ADMIN CREATES ONLY
export const decks = pgTable('decks', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('flashcard'), // 'flashcard' or 'quiz'
  cardCount: integer('card_count').notNull().default(0), // Automatically updated
  order: integer('order').notNull().default(0),
  isPremium: boolean('is_premium').default(false), // true = requires Pro subscription
  isPublished: boolean('is_published').default(true), // Admins can draft decks
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.clerkUserId), // Admin who created it
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for filtering decks by class and published status
  classPublishedIdx: index('idx_decks_class_published').on(table.classId, table.isPublished),
  // Index for ordering decks within a class
  classOrderIdx: index('idx_decks_class_order').on(table.classId, table.order),
}));

// Flashcards table - Individual cards within a deck
// ✅ ADMIN CREATES ONLY
export const flashcards = pgTable('flashcards', {
  id: uuid('id').defaultRandom().primaryKey(),
  deckId: uuid('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  explanation: text('explanation'), // Additional context or learning tips
  difficulty: integer('difficulty'), // Difficulty level (if used in your app)
  order: integer('order').notNull().default(0),
  isPublished: boolean('is_published').default(true), // Admins can draft cards
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.clerkUserId), // Admin who created it
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for filtering flashcards by deck and published status
  deckPublishedIdx: index('idx_flashcards_deck_published').on(table.deckId, table.isPublished),
  // Index for ordering flashcards within a deck
  deckOrderIdx: index('idx_flashcards_deck_order').on(table.deckId, table.order),
}));

// Flashcard Media table - Stores images for questions and answers
// Up to 5 images per question, 5 per answer (10 total per card)
// ✅ ADMIN UPLOADS ONLY (when creating/editing cards)
export const flashcardMedia = pgTable('flashcard_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  flashcardId: uuid('flashcard_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  fileUrl: varchar('file_url', { length: 500 }).notNull(), // Cloud storage URL (Vercel Blob)
  fileKey: varchar('file_key', { length: 500 }).notNull(), // Storage key for deletion
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(), // image/png, image/jpeg, etc.
  placement: varchar('placement', { length: 20 }).notNull(), // 'question' or 'answer'
  order: integer('order').default(0).notNull(), // Order within question or answer (0-4)
  altText: varchar('alt_text', { length: 255 }), // Accessibility description
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Quiz Questions table - Multiple choice questions for flashcards
// ✅ ADMIN CREATES ONLY (via JSON upload)
export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  flashcardId: uuid('flashcard_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  options: json('options').notNull(), // Array of {text: string, isCorrect: boolean, order: number}
  explanation: text('explanation'), // Explanation for the correct answer
  eliminationTactics: text('elimination_tactics'), // Stepwise logic for eliminating wrong answers and distractors
  correctAnswerWithJustification: text('correct_answer_with_justification'), // Clear rationale for the correct option
  order: integer('order').notNull().default(0),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.clerkUserId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fetching all questions for a flashcard
  flashcardIdx: index('idx_quiz_questions_flashcard').on(table.flashcardId),
  // Index for ordering questions within a flashcard
  flashcardOrderIdx: index('idx_quiz_questions_flashcard_order').on(table.flashcardId, table.order),
}));

// Deck Quiz Questions table - Multiple choice questions for entire decks
// ✅ ADMIN CREATES ONLY (via JSON upload)
// Provides comprehensive assessment of all concepts in a deck
export const deckQuizQuestions = pgTable('deck_quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  deckId: uuid('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  options: json('options').notNull(), // Array of {text: string, isCorrect: boolean}
  explanation: text('explanation'), // Explanation for the correct answer
  eliminationTactics: text('elimination_tactics'), // Stepwise logic for eliminating wrong answers and distractors
  correctAnswerWithJustification: text('correct_answer_with_justification'), // Clear rationale for the correct option
  order: integer('order').notNull().default(0),
  difficulty: integer('difficulty'), // Optional: 1-5 difficulty level
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.clerkUserId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fetching all questions for a deck
  deckIdx: index('idx_deck_quiz_questions_deck').on(table.deckId),
  // Index for ordering questions within a deck
  deckOrderIdx: index('idx_deck_quiz_questions_deck_order').on(table.deckId, table.order),
}));

// ============================================
// USER PROGRESS & STUDY TRACKING
// USERS CONSUME CARDS & TRACK PROGRESS
// ============================================

// Bookmarked flashcards table - Tracks user's bookmarked cards
// ✅ USERS BOOKMARK CARDS FOR QUICK ACCESS
export const bookmarkedFlashcards = pgTable('bookmarked_flashcards', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }),
  flashcardId: uuid('flashcard_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique index to prevent duplicate bookmarks
  userFlashcardUnique: index('idx_bookmarked_unique').on(table.clerkUserId, table.flashcardId),
  // Index for querying all bookmarks for a user
  userIdx: index('idx_bookmarked_user').on(table.clerkUserId),
  // Index for checking if a specific card is bookmarked
  flashcardIdx: index('idx_bookmarked_flashcard').on(table.flashcardId),
}));

// User card progress table - Tracks individual card mastery per user
// ✅ USERS TRACK THEIR PROGRESS
export const userCardProgress = pgTable('user_card_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }),
  flashcardId: uuid('flashcard_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  confidenceLevel: integer('confidence_level').default(0), // 0 = not seen, 1-5 = user rating
  timesSeen: integer('times_seen').default(0),
  lastSeen: timestamp('last_seen'),
  nextReviewDate: timestamp('next_review_date'), // For spaced repetition
  masteryStatus: masteryStatusEnum('mastery_status').notNull().default('new'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Composite index for the most common query pattern: filtering by user and multiple flashcard IDs
  userFlashcardIdx: index('idx_user_card_progress_user_flashcard').on(table.clerkUserId, table.flashcardId),
  // Index for mastery status filtering and grouping
  masteryStatusIdx: index('idx_user_card_progress_mastery').on(table.clerkUserId, table.masteryStatus),
}));

// Study sessions table - Tracks study sessions
// ✅ USERS STUDY CARDS
export const studySessions = pgTable('study_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }),
  deckId: uuid('deck_id').references(() => decks.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  cardsStudied: integer('cards_studied').default(0),
  averageConfidence: decimal('average_confidence', { precision: 3, scale: 2 }),
  studyDuration: integer('study_duration'), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Index for querying user's study sessions
  userDeckIdx: index('idx_study_sessions_user_deck').on(table.clerkUserId, table.deckId),
  // Index for time-based queries
  userStartedIdx: index('idx_study_sessions_user_started').on(table.clerkUserId, table.startedAt),
}));

// Session cards table - Tracks individual card reviews within a session
// ✅ USERS RATE CARDS
export const sessionCards = pgTable('session_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => studySessions.id, { onDelete: 'cascade' }),
  flashcardId: uuid('flashcard_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  confidenceRating: integer('confidence_rating').notNull(), // 1-5 scale
  responseTime: integer('response_time'), // in seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Deck progress table - Aggregate statistics per deck per user
// ✅ USERS PROGRESS PER DECK (visible to admins)
export const deckProgress = pgTable('deck_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }),
  deckId: uuid('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  masteryPercentage: decimal('mastery_percentage', { precision: 5, scale: 2 }).default('0'),
  cardsNew: integer('cards_new').default(0),
  cardsLearning: integer('cards_learning').default(0),
  cardsMastered: integer('cards_mastered').default(0),
  lastStudied: timestamp('last_studied'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Class progress table - Aggregate statistics per class per user
// ✅ USERS PROGRESS PER CLASS (visible to admins)
export const classProgress = pgTable('class_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }),
  classId: uuid('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  totalDecks: integer('total_decks').default(0),
  decksStarted: integer('decks_started').default(0),
  decksCompleted: integer('decks_completed').default(0),
  overallMasteryPercentage: decimal('overall_mastery_percentage', { precision: 5, scale: 2 }).default('0'),
  lastStudied: timestamp('last_studied'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User stats table - Overall user statistics across all classes
// ✅ OVERALL USER STATS (visible to admins)
export const userStats = pgTable('user_stats', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().references(() => users.clerkUserId, { onDelete: 'cascade' }).unique(),
  totalCardsStudied: integer('total_cards_studied').default(0),
  studyStreakDays: integer('study_streak_days').default(0),
  totalStudyTime: integer('total_study_time').default(0), // in seconds
  dailyCardsStudiedToday: integer('daily_cards_studied_today').default(0), // For free tier limit
  lastActiveDate: timestamp('last_active_date'),
  lastResetDate: timestamp('last_reset_date'), // Track when daily limit was last reset
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions),
  payments: many(payments),
  cardProgress: many(userCardProgress),
  bookmarkedFlashcards: many(bookmarkedFlashcards),
  studySessions: many(studySessions),
  deckProgress: many(deckProgress),
  classProgress: many(classProgress),
  stats: one(userStats),
  // Admin relations
  createdClasses: many(classes),
  createdDecks: many(decks),
  createdFlashcards: many(flashcards),
  createdQuizQuestions: many(quizQuestions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.clerkUserId],
    references: [users.clerkUserId],
  }),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [classes.createdBy],
    references: [users.clerkUserId],
  }),
  decks: many(decks),
  classProgress: many(classProgress),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  class: one(classes, {
    fields: [decks.classId],
    references: [classes.id],
  }),
  createdBy: one(users, {
    fields: [decks.createdBy],
    references: [users.clerkUserId],
  }),
  flashcards: many(flashcards),
  studySessions: many(studySessions),
  deckProgress: many(deckProgress),
  quizQuestions: many(deckQuizQuestions),
}));

export const flashcardsRelations = relations(flashcards, ({ one, many }) => ({
  deck: one(decks, {
    fields: [flashcards.deckId],
    references: [decks.id],
  }),
  createdBy: one(users, {
    fields: [flashcards.createdBy],
    references: [users.clerkUserId],
  }),
  userProgress: many(userCardProgress),
  bookmarkedBy: many(bookmarkedFlashcards),
  sessionCards: many(sessionCards),
  media: many(flashcardMedia),
  quizQuestions: many(quizQuestions),
}));

export const flashcardMediaRelations = relations(flashcardMedia, ({ one }) => ({
  flashcard: one(flashcards, {
    fields: [flashcardMedia.flashcardId],
    references: [flashcards.id],
  }),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  flashcard: one(flashcards, {
    fields: [quizQuestions.flashcardId],
    references: [flashcards.id],
  }),
  createdBy: one(users, {
    fields: [quizQuestions.createdBy],
    references: [users.clerkUserId],
  }),
}));

export const deckQuizQuestionsRelations = relations(deckQuizQuestions, ({ one }) => ({
  deck: one(decks, {
    fields: [deckQuizQuestions.deckId],
    references: [decks.id],
  }),
  createdBy: one(users, {
    fields: [deckQuizQuestions.createdBy],
    references: [users.clerkUserId],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one, many }) => ({
  user: one(users, {
    fields: [studySessions.clerkUserId],
    references: [users.clerkUserId],
  }),
  deck: one(decks, {
    fields: [studySessions.deckId],
    references: [decks.id],
  }),
  sessionCards: many(sessionCards),
}));

export const sessionCardsRelations = relations(sessionCards, ({ one }) => ({
  session: one(studySessions, {
    fields: [sessionCards.sessionId],
    references: [studySessions.id],
  }),
  flashcard: one(flashcards, {
    fields: [sessionCards.flashcardId],
    references: [flashcards.id],
  }),
}));

export const userCardProgressRelations = relations(userCardProgress, ({ one }) => ({
  user: one(users, {
    fields: [userCardProgress.clerkUserId],
    references: [users.clerkUserId],
  }),
  flashcard: one(flashcards, {
    fields: [userCardProgress.flashcardId],
    references: [flashcards.id],
  }),
}));

export const deckProgressRelations = relations(deckProgress, ({ one }) => ({
  user: one(users, {
    fields: [deckProgress.clerkUserId],
    references: [users.clerkUserId],
  }),
  deck: one(decks, {
    fields: [deckProgress.deckId],
    references: [decks.id],
  }),
}));

export const classProgressRelations = relations(classProgress, ({ one }) => ({
  user: one(users, {
    fields: [classProgress.clerkUserId],
    references: [users.clerkUserId],
  }),
  class: one(classes, {
    fields: [classProgress.classId],
    references: [classes.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.clerkUserId],
    references: [users.clerkUserId],
  }),
}));

export const bookmarkedFlashcardsRelations = relations(bookmarkedFlashcards, ({ one }) => ({
  user: one(users, {
    fields: [bookmarkedFlashcards.clerkUserId],
    references: [users.clerkUserId],
  }),
  flashcard: one(flashcards, {
    fields: [bookmarkedFlashcards.flashcardId],
    references: [flashcards.id],
  }),
}));
