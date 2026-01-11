import { eq } from "drizzle-orm";
import { z } from "zod";
import { error } from "@sveltejs/kit";
import { getRequestEvent, command } from "$app/server";
import db, { passwords, users } from "$db";
import { setSessionTokenCookie } from "$server/auth/cookie";
import { createSession } from "$server/auth/session";
import { createToken } from "$server/auth/token";
import { checkPassword, hashNewPassword } from "$server/crypto";

///////////////////
// login command //
///////////////////

export const login = command(
  z.object({
    email: z.email(),
    password: z.string(),
  }),
  async ({ email, password }) => {
    const session = await db.transaction(async tx => {
      const [pwRecord] = await tx
        .select({
          userId: users.id,
          hash: passwords.hash,
          salt: passwords.salt,
        })
        .from(passwords)
        .innerJoin(users, eq(users.id, passwords.userId))
        .where(eq(users.email, email));

      if (!pwRecord) {
        throw error(400);
      }

      const authed = checkPassword(password, pwRecord.hash, pwRecord.salt);

      if (!authed) {
        throw error(300);
      }

      const session = await createSession(tx, pwRecord.userId);
      return session;
    });

    const token = createToken(session);
    setSessionTokenCookie(token);
  },
);

////////////////////////////
// updatePassword command //
////////////////////////////

export const updatePassword = command(
  z.object({
    old: z.string(),
    new: z.string(),
  }),
  async input => {
    const event = getRequestEvent();
    if (!event.locals.session) {
      throw error(401);
    }
    const session = event.locals.session;
    const newHash = hashNewPassword(input.new);

    await db.transaction(async tx => {
      const [pwRecord] = await tx
        .select()
        .from(passwords)
        .where(eq(passwords.userId, session.userId));

      if (!pwRecord) {
        console.error(`${session.userEmail} has no password.`);
        throw error(500);
      }

      if (!checkPassword(input.old, pwRecord.hash, pwRecord.salt)) {
        throw error(400, "Incorrect password");
      }

      await tx.update(passwords).set({
        hash: newHash.hash,
        salt: newHash.salt,
      });
    });
  },
);
