import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getRequestEvent, command } from "$app/server";
import db, { userPasswords } from "$db";
import { checkPassword, hashNewPassword } from "$server/crypto";

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

    await db.transaction(async tx => {
      const [pwRecord] = await tx
        .select()
        .from(userPasswords)
        .where(eq(userPasswords.userId, session.userId));

      if (!pwRecord) {
        console.error(`${session.userEmail} has no password.`);
        throw error(500);
      }

      if (!checkPassword(input.old, pwRecord.hash, pwRecord.salt)) {
        throw error(400, "Incorrect password");
      }

      const newHash = hashNewPassword(input.new);
      await tx.update(userPasswords).set({
        hash: newHash.hash,
        salt: newHash.salt,
      });
    });
  },
);
