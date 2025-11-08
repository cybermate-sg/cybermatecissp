-- Migration: Add Quiz Questions Table
-- Created: 2025-11-08
-- Purpose: Add quiz_questions table to store multiple choice questions for flashcards

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flashcard_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"options" json NOT NULL,
	"explanation" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_created_by_users_clerk_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("clerk_user_id") ON DELETE no action ON UPDATE no action;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_quiz_questions_flashcard" ON "quiz_questions" ("flashcard_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_questions_flashcard_order" ON "quiz_questions" ("flashcard_id", "order");
