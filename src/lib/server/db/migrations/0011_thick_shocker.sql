CREATE TYPE "public"."card_activity_type" AS ENUM('card_created', 'card_content_updated', 'card_moved', 'card_archived', 'card_unarchived', 'card_deleted', 'card_due_date_set', 'card_due_date_cleared', 'card_assignee_added', 'card_assignee_removed', 'card_label_added', 'card_label_removed');--> statement-breakpoint
CREATE TABLE "card_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"user_id" text,
	"activity_type" "card_activity_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"acted_at" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
ALTER TABLE "columns" ADD COLUMN "color" text DEFAULT '#6366f1' NOT NULL;--> statement-breakpoint
ALTER TABLE "card_activity" ADD CONSTRAINT "card_activity_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;