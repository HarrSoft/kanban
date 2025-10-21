import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import db, { users } from "$db";
import { isLoggedIn, isUserOrAdmin } from "$rules";
import { UserHandle, UserProfile } from "$types";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  isLoggedIn();

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.handle, params.userHandle));

  if (!dbUser) {
    return error(404);
  }

  return new Response(
    JSON.stringify(
      UserProfile.parse({
        ...dbUser,
        image: dbUser.imageUrl,
        verified: !!dbUser.emailVerified,
      } satisfies UserProfile),
    ),
  );
};

export const DELETE: RequestHandler = async ({ params }) => {
  const handle = params.userHandle as UserHandle;

  isUserOrAdmin(handle);

  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(eq(users.handle, handle));

  return new Response();
};
