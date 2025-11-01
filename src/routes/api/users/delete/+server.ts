import { eq } from "drizzle-orm";
import db, { users } from "$db";
import { isUserOrAdmin } from "$api/rules";
import type { RequestHandler } from "./$types";
import { Input } from ".";

export const POST: RequestHandler = async ({ request }) => {
  const input = Input.parse(await request.json());

  isUserOrAdmin(input);

  const identity =
    input.id ? eq(users.id, input.id)
    : input.handle ? eq(users.handle, input.handle)
    : input.email ? eq(users.email, input.email)
    : null;

  await db.update(users).set({ deletedAt: new Date() }).where(identity!);

  return new Response();
};
