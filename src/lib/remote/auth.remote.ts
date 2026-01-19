import { eq } from "drizzle-orm";
import { z } from "zod";
import { error, redirect } from "@sveltejs/kit";
import { command, form, getRequestEvent } from "$app/server";
import db, { passwords, users } from "$db";
import { setSessionTokenCookie } from "$server/auth/cookie";
import { createSession } from "$server/auth/session";
import { createToken } from "$server/auth/token";
import { checkPassword, hashNewPassword } from "$server/crypto";

////////////////
// login form //
////////////////

export const login = form(
  z.object({
    email: z.email(),
    _password: z.string(),
  }),
  async ({ email, _password }) => {
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

      const authed = checkPassword(_password, pwRecord.hash, pwRecord.salt);

      if (!authed) {
        throw error(300);
      }

      const session = await createSession(tx, pwRecord.userId);
      return session;
    });

    const token = createToken(session);
    setSessionTokenCookie(token);

    redirect(303, "/");
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
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    }

    const newHash = hashNewPassword(input.new);

    await db.transaction(async tx => {
      const [pwRecord] = await tx
        .select()
        .from(passwords)
        .where(eq(passwords.userId, session.userId));

      if (!pwRecord) {
        console.warn(`User ${session.userEmail} had no password.`);
        await tx.insert(passwords).values({
          userId: session.userId,
          hash: newHash.hash,
          salt: newHash.salt,
        });
        return;
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
