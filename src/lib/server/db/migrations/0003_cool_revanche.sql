CREATE TABLE "invites" (
	"email" text NOT NULL,
	"code" text NOT NULL,
	"admin" boolean DEFAULT false NOT NULL,
	CONSTRAINT "invites_email_unique" UNIQUE("email"),
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
