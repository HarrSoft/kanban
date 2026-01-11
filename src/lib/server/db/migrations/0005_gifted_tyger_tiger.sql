ALTER TYPE "public"."platform_role" ADD VALUE 'viewer';--> statement-breakpoint
COMMIT;
ALTER TABLE "users" RENAME COLUMN "platformRole" TO "platform_role";--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "platform_role" "platform_role" DEFAULT 'viewer' NOT NULL;
