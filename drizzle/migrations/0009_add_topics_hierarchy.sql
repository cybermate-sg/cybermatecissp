-- Topics table - Stores course topics (e.g., "1.1 - Understand, adhere to, and promote professional ethics")
-- Generic naming for future scalability (not just CISSP)
CREATE TABLE IF NOT EXISTS "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_number" integer NOT NULL,
	"topic_code" varchar(20) NOT NULL,
	"topic_name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Sub-topics table - Stores sub-topics under each topic
-- e.g., "5 Pillars of Information Security" under topic "1.2"
CREATE TABLE IF NOT EXISTS "sub_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"sub_topic_name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add sub_topic_id column to deck_quiz_questions table
ALTER TABLE "deck_quiz_questions" ADD COLUMN IF NOT EXISTS "sub_topic_id" uuid;

-- Add foreign key constraint for sub_topics -> topics
DO $$ BEGIN
 ALTER TABLE "sub_topics" ADD CONSTRAINT "sub_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Add foreign key constraint for deck_quiz_questions -> sub_topics
DO $$ BEGIN
 ALTER TABLE "deck_quiz_questions" ADD CONSTRAINT "deck_quiz_questions_sub_topic_id_sub_topics_id_fk" FOREIGN KEY ("sub_topic_id") REFERENCES "public"."sub_topics"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS "idx_topics_domain" ON "topics" USING btree ("domain_number");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_topics_code_unique" ON "topics" USING btree ("topic_code");
CREATE INDEX IF NOT EXISTS "idx_sub_topics_topic" ON "sub_topics" USING btree ("topic_id");
CREATE INDEX IF NOT EXISTS "idx_deck_quiz_questions_sub_topic" ON "deck_quiz_questions" USING btree ("sub_topic_id");
