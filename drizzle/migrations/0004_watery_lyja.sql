CREATE TABLE "admin_ai_daily_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar(255) NOT NULL,
	"usage_date" varchar(10) NOT NULL,
	"generations_used" integer DEFAULT 0 NOT NULL,
	"quota_limit" integer DEFAULT 50 NOT NULL,
	"last_reset_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_ai_quota_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar(255) NOT NULL,
	"daily_quota_limit" integer DEFAULT 50 NOT NULL,
	"flashcard_questions_default" integer DEFAULT 5 NOT NULL,
	"deck_questions_default" integer DEFAULT 50 NOT NULL,
	"quota_reset_hour" integer DEFAULT 0 NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_ai_quota_config_admin_id_unique" UNIQUE("admin_id")
);
--> statement-breakpoint
CREATE TABLE "ai_quiz_generation_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar(255) NOT NULL,
	"flashcard_id" uuid,
	"deck_id" uuid,
	"topic" varchar(500) NOT NULL,
	"generation_type" varchar(20) NOT NULL,
	"num_questions_generated" integer NOT NULL,
	"prompt_used" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"api_response_status" integer,
	"error_message" text,
	"total_cost_usd" numeric(10, 6),
	"tokens_used" integer,
	"response_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_ai_daily_usage" ADD CONSTRAINT "admin_ai_daily_usage_admin_id_users_clerk_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_ai_quota_config" ADD CONSTRAINT "admin_ai_quota_config_admin_id_users_clerk_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_quiz_generation_log" ADD CONSTRAINT "ai_quiz_generation_log_admin_id_users_clerk_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_quiz_generation_log" ADD CONSTRAINT "ai_quiz_generation_log_flashcard_id_flashcards_id_fk" FOREIGN KEY ("flashcard_id") REFERENCES "public"."flashcards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_quiz_generation_log" ADD CONSTRAINT "ai_quiz_generation_log_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_usage_admin_date" ON "admin_ai_daily_usage" USING btree ("admin_id","usage_date");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_date" ON "admin_ai_daily_usage" USING btree ("usage_date");--> statement-breakpoint
CREATE INDEX "idx_ai_quota_admin" ON "admin_ai_quota_config" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_ai_quota_enabled" ON "admin_ai_quota_config" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_ai_log_admin_created" ON "ai_quiz_generation_log" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_log_status" ON "ai_quiz_generation_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ai_log_flashcard" ON "ai_quiz_generation_log" USING btree ("flashcard_id");--> statement-breakpoint
CREATE INDEX "idx_ai_log_deck" ON "ai_quiz_generation_log" USING btree ("deck_id");