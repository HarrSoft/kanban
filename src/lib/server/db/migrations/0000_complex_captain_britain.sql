CREATE TYPE "public"."platform_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."project_member_role" AS ENUM('admin', 'contributor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('auto', 'burning-love', 'oceanside', 'ribbit-dark', 'ribbit-light');--> statement-breakpoint
CREATE TABLE "invites" (
	"email" text NOT NULL,
	"code" text NOT NULL,
	"platform_role" "platform_role" DEFAULT 'user' NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "invites_email_unique" UNIQUE("email"),
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "passwords" (
	"user_id" text PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"salt" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"user_id" text,
	"project_id" text,
	"role" "project_member_role",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "project_members_user_id_project_id_pk" PRIMARY KEY("user_id","project_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"imageUrl" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeclocks" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"start" timestamp DEFAULT now() NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"platform_role" "platform_role" DEFAULT 'user' NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"name" text,
	"imageUrl" text,
	"bio" text,
	"theme" "theme" DEFAULT 'auto' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeclocks" ADD CONSTRAINT "timeclocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeclocks" ADD CONSTRAINT "timeclocks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;