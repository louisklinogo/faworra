CREATE TYPE "public"."team_invite_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
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
ALTER TABLE "users_on_team" RENAME TO "team_memberships";--> statement-breakpoint
ALTER TABLE "team_memberships" DROP CONSTRAINT "users_on_team_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "team_memberships" DROP CONSTRAINT "users_on_team_team_id_teams_id_fk";
--> statement-breakpoint
DROP INDEX "users_on_team_user_id_idx";--> statement-breakpoint
DROP INDEX "users_on_team_team_id_idx";--> statement-breakpoint
DROP INDEX "users_on_team_user_id_team_id_idx";--> statement-breakpoint
ALTER TABLE "user_context" ADD COLUMN "active_membership_id" uuid;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_invites_team_id_idx" ON "team_invites" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invites_normalized_email_idx" ON "team_invites" USING btree ("normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invites_pending_team_id_normalized_email_idx" ON "team_invites" USING btree ("team_id","normalized_email") WHERE "team_invites"."status" = 'pending'::team_invite_status;--> statement-breakpoint
ALTER TABLE "user_context" ADD CONSTRAINT "user_context_active_membership_id_team_memberships_id_fk" FOREIGN KEY ("active_membership_id") REFERENCES "public"."team_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_memberships_user_id_idx" ON "team_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_memberships_team_id_idx" ON "team_memberships" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_memberships_user_id_team_id_idx" ON "team_memberships" USING btree ("user_id","team_id");--> statement-breakpoint
UPDATE "user_context" AS "uc"
SET "active_membership_id" = "tm"."id"
FROM "team_memberships" AS "tm"
WHERE "uc"."user_id" = "tm"."user_id"
	AND "uc"."active_team_id" = "tm"."team_id"
	AND "uc"."active_team_id" IS NOT NULL;