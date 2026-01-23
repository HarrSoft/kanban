import { eq } from "drizzle-orm";
import * as v from "valibot";
import { error, redirect } from "@sveltejs/kit";
import { form, getRequestEvent, query } from "$app/server";
import db, { passwords, users } from "$db";
import {
  setSessionTokenCookie,
  deleteSessionTokenCookie,
} from "$server/auth/cookie";
import { createSession, invalidateSession } from "$server/auth/session";
import { createToken } from "$server/auth/token";
import { checkPassword, hashNewPassword } from "$server/crypto";

//////////////////////
// getSession query //
//////////////////////

export const getSession = query(() => {
  const event = getRequestEvent();
  return event.locals.session;
});

////////////////
// login form //
////////////////

export const login = form(
  v.object({
    email: v.pipe(v.string(), v.email()),
    _password: v.string(),
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

    getSession().set(session);

    const token = createToken(session);
    setSessionTokenCookie(token);

    redirect(303, "/");
  },
);

/////////////////
// logout form //
/////////////////

export const logout = form(async () => {
  const event = getRequestEvent();
  const session = event.locals.session;

  if (session) {
    await invalidateSession(db, session.sessionId);
    deleteSessionTokenCookie();
  }

  getSession().set(null);

  redirect(303, "/");
});

/////////////////////////
// updatePassword form //
/////////////////////////

export const updatePassword = form(
  v.object({
    _old: v.string(),
    _new: v.string(),
  }),
  async input => {
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    }

    const newHash = hashNewPassword(input._new);

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

      if (!checkPassword(input._old, pwRecord.hash, pwRecord.salt)) {
        throw error(400, "Incorrect password");
      }

      await tx.update(passwords).set({
        hash: newHash.hash,
        salt: newHash.salt,
      });
    });

    redirect(303, `/user/${session.userId}`);
  },
);
