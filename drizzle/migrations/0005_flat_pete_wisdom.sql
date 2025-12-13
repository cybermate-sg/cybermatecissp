CREATE TABLE "ai_model_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(100),
	"priority" integer DEFAULT 100 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"timeout_ms" integer,
	"temperature" numeric(3, 2),
	"max_tokens" integer,
	"cost_per_1k_tokens" numeric(10, 6),
	"is_free" boolean DEFAULT true NOT NULL,
	"description" text,
	"last_used_at" timestamp,
	"success_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"avg_response_time_ms" integer,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_model_configurations_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
ALTER TABLE "ai_quiz_generation_log" ADD COLUMN "model_config_id" uuid;--> statement-breakpoint
ALTER TABLE "ai_model_configurations" ADD CONSTRAINT "ai_model_configurations_created_by_users_clerk_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("clerk_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_models_enabled_priority" ON "ai_model_configurations" USING btree ("enabled","priority");--> statement-breakpoint
CREATE INDEX "idx_ai_models_provider" ON "ai_model_configurations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_ai_models_success" ON "ai_model_configurations" USING btree ("success_count");--> statement-breakpoint
ALTER TABLE "ai_quiz_generation_log" ADD CONSTRAINT "ai_quiz_generation_log_model_config_id_ai_model_configurations_id_fk" FOREIGN KEY ("model_config_id") REFERENCES "public"."ai_model_configurations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_log_model" ON "ai_quiz_generation_log" USING btree ("model_config_id");