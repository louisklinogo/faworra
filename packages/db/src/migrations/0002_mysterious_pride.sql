ALTER TABLE "bank_accounts" ADD COLUMN "error_retries" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "error_details" text;