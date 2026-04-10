CREATE TYPE "public"."bank_account_sync_status" AS ENUM('pending', 'syncing', 'available', 'failed');--> statement-breakpoint
CREATE TYPE "public"."bank_connection_detail_status" AS ENUM('linked', 'processing', 'available', 'partial', 'unavailable', 'expired', 'failed');--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "balance" integer;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "available_balance" integer;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "credit_limit" integer;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "sync_status" "bank_account_sync_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "bank_connections" ADD COLUMN "provider" text DEFAULT 'mono' NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD COLUMN "enrollment_id" text;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD COLUMN "detail_status" "bank_connection_detail_status";--> statement-breakpoint
ALTER TABLE "bank_connections" ADD COLUMN "error_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD COLUMN "last_synced_at" timestamp;