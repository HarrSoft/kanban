import { and, eq, isNull } from "drizzle-orm";
import { error, json } from "@sveltejs/kit";
import { isLoggedIn } from "$api/rules";
import db, { users } from "$db";
import type { RequestHandler } from "./$types";
import { Input, Result } from ".";

export const POST: RequestHandler = async ({ request }) => {
  isLoggedIn();

  const input = Input.parse(await request.json());

  const identity =
    input.id ? eq(users.id, input.id)
    : input.handle ? eq(users.handle, input.handle)
    : input.email ? eq(users.email, input.email)
    : null;

  const [dbUser] = await db
    .select()
    .from(users)
    .where(and(identity!, isNull(users.deletedAt)));

  if (!dbUser) {
    return error(404);
  }

  return json(
    Result.parse({
      ok: true,
      user: {
        ...dbUser,
        image: dbUser.imageUrl,
        verified: !!dbUser.emailVerified,
      },
    } satisfies Result),
  );
};
