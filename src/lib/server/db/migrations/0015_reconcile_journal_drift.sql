-- Reconcile the migration journal to the schema (the drift named 2026-09-19).
-- `cards.priority` and the two card_activity enum values were changed in the
-- schema but never written as migrations (pushed, not migrated); `timeclocks.notes`
-- had a migration (0014) but no snapshot, so it was re-emitted here too.
-- Idempotent on purpose: production auto-applies migrations, and may or may not
-- already carry some of these, so every statement is a safe no-op if present.
ALTER TYPE "public"."card_activity_type" ADD VALUE IF NOT EXISTS 'card_comment_edited';--> statement-breakpoint
ALTER TYPE "public"."card_activity_type" ADD VALUE IF NOT EXISTS 'card_comment_deleted';--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "timeclocks" ADD COLUMN IF NOT EXISTS "notes" text;
