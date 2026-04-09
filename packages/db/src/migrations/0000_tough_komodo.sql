CREATE TYPE "public"."accounting_provider" AS ENUM('xero', 'quickbooks', 'fortnox');--> statement-breakpoint
CREATE TYPE "public"."accounting_sync_status" AS ENUM('synced', 'failed', 'pending', 'partial');--> statement-breakpoint
CREATE TYPE "public"."accounting_sync_type" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."bank_account_type" AS ENUM('bank', 'momo', 'cash', 'other');--> statement-breakpoint
CREATE TYPE "public"."bank_connection_status" AS ENUM('connected', 'disconnected', 'error');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('processing', 'pending', 'archived', 'new', 'analyzing');--> statement-breakpoint
CREATE TYPE "public"."transaction_frequency" AS ENUM('weekly', 'biweekly', 'monthly', 'semi_monthly', 'annually', 'irregular', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."transaction_method" AS ENUM('payment', 'card_purchase', 'card_atm', 'transfer', 'other', 'unknown', 'ach', 'interest', 'deposit', 'wire', 'fee', 'momo', 'cash');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('posted', 'pending', 'excluded', 'completed', 'archived', 'exported');--> statement-breakpoint
CREATE TYPE "public"."team_invite_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('owner', 'admin', 'accountant', 'member');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_context" (
	"user_id" text PRIMARY KEY NOT NULL,
	"active_membership_id" uuid,
	"active_team_id" uuid,
	"locale" text,
	"timezone" text,
	"timezone_auto_sync" boolean DEFAULT true NOT NULL,
	"date_format" text,
	"time_format" integer DEFAULT 24 NOT NULL,
	"week_starts_on_monday" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounting_sync_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"provider" "accounting_provider" NOT NULL,
	"provider_tenant_id" text NOT NULL,
	"provider_transaction_id" text,
	"synced_attachment_mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"sync_type" "accounting_sync_type",
	"status" "accounting_sync_status" DEFAULT 'synced' NOT NULL,
	"error_message" text,
	"error_code" text,
	"provider_entity_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"bank_connection_id" uuid,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"type" "bank_account_type" DEFAULT 'bank' NOT NULL,
	"account_number" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"manual" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"institution_name" text,
	"status" "bank_connection_status" DEFAULT 'connected' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"team_id" uuid,
	"file_path" text[],
	"file_name" text,
	"transaction_id" uuid,
	"amount" integer,
	"currency" text,
	"content_type" text,
	"size" integer,
	"attachment_id" uuid,
	"date" text,
	"status" "inbox_status" DEFAULT 'new',
	"sender_email" text,
	"display_name" text
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"path" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_categories" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"team_id" uuid NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"system" boolean DEFAULT false,
	"slug" text,
	"tax_rate" numeric(10, 2),
	"tax_type" text,
	"tax_reporting_code" text,
	"excluded" boolean DEFAULT false,
	"description" text,
	"parent_id" uuid,
	CONSTRAINT "transaction_categories_pkey" PRIMARY KEY("team_id","slug"),
	CONSTRAINT "transaction_categories_id_unique" UNIQUE("id"),
	CONSTRAINT "unique_team_slug" UNIQUE("team_id","slug")
);
--> statement-breakpoint
CREATE TABLE "transaction_match_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"team_id" uuid NOT NULL,
	"inbox_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"confidence_score" real NOT NULL,
	"amount_score" real,
	"currency_score" real,
	"date_score" real,
	"name_score" real,
	"match_type" text NOT NULL,
	"match_details" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_action_at" timestamp,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "transaction_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"bank_account_id" uuid,
	"category_slug" text,
	"assigned_id" text,
	"internal_id" text NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"base_amount" integer,
	"base_currency" text,
	"description" text,
	"note" text,
	"method" "transaction_method" DEFAULT 'other' NOT NULL,
	"status" "transaction_status" DEFAULT 'posted' NOT NULL,
	"counterparty_name" text,
	"tax_amount" integer,
	"tax_rate" real,
	"tax_type" text,
	"balance" integer,
	"internal" boolean DEFAULT false NOT NULL,
	"manual" boolean DEFAULT true NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"recurring" boolean DEFAULT false,
	"frequency" "transaction_frequency",
	"merchant_name" text,
	"enrichment_completed" boolean DEFAULT false,
	"transaction_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"role" "team_role" NOT NULL,
	"status" "team_invite_status" DEFAULT 'pending' NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_user_id" text NOT NULL,
	"accepted_by_user_id" text,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "team_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"team_id" uuid NOT NULL,
	"role" "team_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_settings" (
	"team_id" uuid PRIMARY KEY NOT NULL,
	"base_currency" text,
	"country_code" text,
	"fiscal_year_start_month" integer,
	"industry_key" text,
	"industry_config_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context" ADD CONSTRAINT "user_context_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context" ADD CONSTRAINT "user_context_active_membership_id_team_memberships_id_fk" FOREIGN KEY ("active_membership_id") REFERENCES "public"."team_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_context" ADD CONSTRAINT "user_context_active_team_id_teams_id_fk" FOREIGN KEY ("active_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_sync_records" ADD CONSTRAINT "accounting_sync_records_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_sync_records" ADD CONSTRAINT "accounting_sync_records_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_bank_connection_id_bank_connections_id_fk" FOREIGN KEY ("bank_connection_id") REFERENCES "public"."bank_connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "transaction_attachments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_attachments" ADD CONSTRAINT "transaction_attachments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."transaction_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_inbox_id_inbox_id_fk" FOREIGN KEY ("inbox_id") REFERENCES "public"."inbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_match_suggestions" ADD CONSTRAINT "transaction_match_suggestions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_tags" ADD CONSTRAINT "transaction_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_settings" ADD CONSTRAINT "team_settings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_transaction" ON "accounting_sync_records" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_team_provider" ON "accounting_sync_records" USING btree ("team_id","provider");--> statement-breakpoint
CREATE INDEX "idx_accounting_sync_status" ON "accounting_sync_records" USING btree ("team_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "accounting_sync_records_transaction_provider_key" ON "accounting_sync_records" USING btree ("transaction_id","provider");--> statement-breakpoint
CREATE INDEX "bank_accounts_team_id_idx" ON "bank_accounts" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_connection_id_idx" ON "bank_accounts" USING btree ("bank_connection_id");--> statement-breakpoint
CREATE INDEX "bank_connections_team_id_idx" ON "bank_connections" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "inbox_team_id_idx" ON "inbox" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "inbox_transaction_id_idx" ON "inbox" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "inbox_status_idx" ON "inbox" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tags_team_id_idx" ON "tags" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_team_id_slug_idx" ON "tags" USING btree ("team_id","slug");--> statement-breakpoint
CREATE INDEX "transaction_attachments_team_id_idx" ON "transaction_attachments" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "transaction_attachments_transaction_id_idx" ON "transaction_attachments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_categories_team_id_idx" ON "transaction_categories" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "transaction_categories_parent_id_idx" ON "transaction_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_inbox_id_idx" ON "transaction_match_suggestions" USING btree ("inbox_id");--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_transaction_id_idx" ON "transaction_match_suggestions" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_team_id_idx" ON "transaction_match_suggestions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "transaction_match_suggestions_status_idx" ON "transaction_match_suggestions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_match_suggestions_unique" ON "transaction_match_suggestions" USING btree ("inbox_id","transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_tags_team_id_idx" ON "transaction_tags" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "transaction_tags_transaction_id_idx" ON "transaction_tags" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "transaction_tags_tag_id_idx" ON "transaction_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_tags_unique_idx" ON "transaction_tags" USING btree ("transaction_id","tag_id");--> statement-breakpoint
CREATE INDEX "transactions_team_id_idx" ON "transactions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "transactions_bank_account_id_idx" ON "transactions" USING btree ("bank_account_id");--> statement-breakpoint
CREATE INDEX "transactions_category_slug_idx" ON "transactions" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "transactions_transaction_date_idx" ON "transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "transactions_assigned_id_idx" ON "transactions" USING btree ("assigned_id");--> statement-breakpoint
CREATE INDEX "transactions_internal_id_idx" ON "transactions" USING btree ("internal_id");--> statement-breakpoint
CREATE INDEX "transactions_counterparty_name_idx" ON "transactions" USING btree ("counterparty_name");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_team_internal_id_idx" ON "transactions" USING btree ("team_id","internal_id");--> statement-breakpoint
CREATE INDEX "team_invites_team_id_idx" ON "team_invites" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invites_normalized_email_idx" ON "team_invites" USING btree ("normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invites_pending_team_id_normalized_email_idx" ON "team_invites" USING btree ("team_id","normalized_email") WHERE "team_invites"."status" = 'pending'::team_invite_status;--> statement-breakpoint
CREATE INDEX "team_memberships_user_id_idx" ON "team_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_memberships_team_id_idx" ON "team_memberships" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_memberships_user_id_team_id_idx" ON "team_memberships" USING btree ("user_id","team_id");