import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { command } from "$app/server";
import db, { passwords, users } from "$db";
import { setSessionTokenCookie } from "$server/auth/cookie";
import { createSession } from "$server/auth/session";
import { createToken } from "$server/auth/token";
import { checkPassword } from "$server/crypto";

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

      const authed = checkPassword(
        password,
        pwRecord.hash,
        pwRecord.salt,
      );

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
