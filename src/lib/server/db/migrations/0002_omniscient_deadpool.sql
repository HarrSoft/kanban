ALTER TABLE "projects" DROP CONSTRAINT "projects_handle_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_handle_unique";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "handle";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "handle";