ALTER TYPE "public"."card_activity_type" ADD VALUE IF NOT EXISTS 'card_comment_added';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "card_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"card_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
ALTER TABLE "card_comments" ADD CONSTRAINT "card_comments_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_comments" ADD CONSTRAINT "card_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
