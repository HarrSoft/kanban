import { eq } from "drizzle-orm";
import db, { users } from "$db";
import { isUserOrAdmin } from "$api/rules";
import { unixNow } from "$db/schema/util";
import * as v from "valibot";
import type { RequestHandler } from "./$types";
import { Input } from ".";

export const POST: RequestHandler = async ({ request }) => {
	const input = v.parse(Input, await request.json());

	isUserOrAdmin(input);

	// Soft-delete by setting deletedAt to now (unix timestamp)
	await db
		.update(users)
		.set({ deletedAt: unixNow() })
		.where(eq(users.id, input));

	return new Response();
};
