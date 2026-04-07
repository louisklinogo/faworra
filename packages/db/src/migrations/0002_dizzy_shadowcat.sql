ALTER TABLE "user_context" ADD COLUMN "locale" text;--> statement-breakpoint
ALTER TABLE "user_context" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "user_context" ADD COLUMN "timezone_auto_sync" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_context" ADD COLUMN "date_format" text;--> statement-breakpoint
ALTER TABLE "user_context" ADD COLUMN "time_format" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_context" ADD COLUMN "week_starts_on_monday" boolean DEFAULT true NOT NULL;