import { and, eq, isNull } from "drizzle-orm";
import { error, json } from "@sveltejs/kit";
import { isLoggedIn } from "$api/rules";
import db, { users } from "$db";
import * as v from "valibot";
import { UserProfile } from "$types";
import type { RequestHandler } from "./$types";
import { Input } from ".";

export const POST: RequestHandler = async ({ request }) => {
	isLoggedIn();

	const input = v.parse(Input, await request.json());

	const [dbUser] = await db
		.select()
		.from(users)
		.where(and(eq(users.id, input), isNull(users.deletedAt)));

	if (!dbUser) {
		return error(404);
	}

	const profile = v.parse(UserProfile, {
		id: dbUser.id,
		name: dbUser.name,
		email: dbUser.email,
		platformRole: dbUser.platformRole,
		imageUrl: dbUser.imageUrl,
		verified: !!dbUser.emailVerified,
		bio: dbUser.bio,
	});

	return json(profile);
};
