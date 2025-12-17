CREATE TYPE "public"."feedback_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('pending', 'in_review', 'resolved', 'closed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('content_error', 'typo', 'unclear_explanation', 'technical_issue', 'general_suggestion');--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"flashcard_id" uuid,
	"quiz_question_id" uuid,
	"deck_quiz_question_id" uuid,
	"deck_id" uuid,
	"class_id" uuid,
	"feedback_type" "feedback_type" NOT NULL,
	"feedback_text" text NOT NULL,
	"screenshot_url" varchar(500),
	"screenshot_key" varchar(500),
	"user_agent" text,
	"page_url" text,
	"status" "feedback_status" DEFAULT 'pending' NOT NULL,
	"priority" "feedback_priority" DEFAULT 'medium' NOT NULL,
	"admin_response" text,
	"resolved_by" varchar(255),
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_clerk_user_id_users_clerk_user_id_fk" FOREIGN KEY ("clerk_user_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_quiz_question_id_quiz_questions_id_fk" FOREIGN KEY ("quiz_question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_deck_quiz_question_id_deck_quiz_questions_id_fk" FOREIGN KEY ("deck_quiz_question_id") REFERENCES "public"."deck_quiz_questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feedback" ADD CONSTRAINT "user_feedback_resolved_by_users_clerk_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("clerk_user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_user" ON "user_feedback" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_status" ON "user_feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_feedback_priority" ON "user_feedback" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_feedback_type" ON "user_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "idx_feedback_flashcard" ON "user_feedback" USING btree ("flashcard_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_quiz_question" ON "user_feedback" USING btree ("quiz_question_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_deck_quiz_question" ON "user_feedback" USING btree ("deck_quiz_question_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_status_created" ON "user_feedback" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_feedback_deck" ON "user_feedback" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_class" ON "user_feedback" USING btree ("class_id");