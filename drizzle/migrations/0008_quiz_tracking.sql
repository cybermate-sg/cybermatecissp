-- Quiz Sessions tracking (completed quizzes only)
CREATE TABLE IF NOT EXISTS "quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"flashcard_id" uuid,
	"deck_id" uuid,
	"quiz_type" varchar(20) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"total_questions" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"score_percentage" numeric(5, 2),
	"quiz_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_sessions_quiz_type_check" CHECK ("quiz_type" IN ('flashcard', 'deck'))
);

-- Quiz Session Answers tracking (individual answers within quiz)
CREATE TABLE IF NOT EXISTS "quiz_session_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"quiz_question_id" uuid,
	"deck_quiz_question_id" uuid,
	"selected_option_index" integer NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_spent" integer,
	"question_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- User Quiz Progress (flashcard-level quiz aggregates)
CREATE TABLE IF NOT EXISTS "user_quiz_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"flashcard_id" uuid NOT NULL,
	"times_taken" integer DEFAULT 0,
	"total_questions_answered" integer DEFAULT 0,
	"total_correct_answers" integer DEFAULT 0,
	"average_score" numeric(5, 2),
	"best_score" numeric(5, 2),
	"last_score" numeric(5, 2),
	"last_taken" timestamp,
	"mastery_status" "mastery_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Deck Quiz Progress (deck-level quiz aggregates)
CREATE TABLE IF NOT EXISTS "deck_quiz_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"deck_id" uuid NOT NULL,
	"times_taken" integer DEFAULT 0,
	"total_questions_answered" integer DEFAULT 0,
	"total_correct_answers" integer DEFAULT 0,
	"average_score" numeric(5, 2),
	"best_score" numeric(5, 2),
	"last_score" numeric(5, 2),
	"last_taken" timestamp,
	"mastery_percentage" numeric(5, 2) DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add domain_number column to decks table for faster domain grouping
ALTER TABLE "decks" ADD COLUMN IF NOT EXISTS "domain_number" integer;

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quiz_session_answers" ADD CONSTRAINT "quiz_session_answers_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quiz_session_answers" ADD CONSTRAINT "quiz_session_answers_quiz_question_id_quiz_questions_id_fk" FOREIGN KEY ("quiz_question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "quiz_session_answers" ADD CONSTRAINT "quiz_session_answers_deck_quiz_question_id_deck_quiz_questions_id_fk" FOREIGN KEY ("deck_quiz_question_id") REFERENCES "public"."deck_quiz_questions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_quiz_progress" ADD CONSTRAINT "user_quiz_progress_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "deck_quiz_progress" ADD CONSTRAINT "deck_quiz_progress_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "deck_quiz_progress" ADD CONSTRAINT "deck_quiz_progress_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS "idx_quiz_sessions_user_started" ON "quiz_sessions" USING btree ("clerk_user_id","started_at");
CREATE INDEX IF NOT EXISTS "idx_quiz_sessions_flashcard" ON "quiz_sessions" USING btree ("flashcard_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_sessions_deck" ON "quiz_sessions" USING btree ("deck_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_sessions_type" ON "quiz_sessions" USING btree ("quiz_type");

CREATE INDEX IF NOT EXISTS "idx_quiz_answers_session" ON "quiz_session_answers" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_answers_question" ON "quiz_session_answers" USING btree ("quiz_question_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_answers_deck_question" ON "quiz_session_answers" USING btree ("deck_quiz_question_id");

CREATE INDEX IF NOT EXISTS "idx_user_quiz_progress_user_flashcard" ON "user_quiz_progress" USING btree ("clerk_user_id","flashcard_id");
CREATE INDEX IF NOT EXISTS "idx_user_quiz_progress_mastery" ON "user_quiz_progress" USING btree ("clerk_user_id","mastery_status");

CREATE INDEX IF NOT EXISTS "idx_deck_quiz_progress_user_deck" ON "deck_quiz_progress" USING btree ("clerk_user_id","deck_id");
CREATE INDEX IF NOT EXISTS "idx_deck_quiz_progress_user" ON "deck_quiz_progress" USING btree ("clerk_user_id");

CREATE INDEX IF NOT EXISTS "idx_decks_domain" ON "decks" USING btree ("domain_number");
