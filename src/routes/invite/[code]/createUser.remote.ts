import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { command } from "$app/server";
import db, { invites, passwords, users } from "$db";
import { hashNewPassword } from "$server/crypto";

export const createUser = command(
  z.object({
    inviteCode: z.string(),
    password: z.string(),
  }),
  async ({ inviteCode, password }) => {
    const passwordHash = hashNewPassword(password);

    await db.transaction(async tx => {
      const [invite] = await tx
        .select()
        .from(invites)
        .where(eq(invites.code, inviteCode));

      if (!invite) {
        throw error(404, "No such code");
      }

      const [newUser] = await tx
        .insert(users)
        .values({
          email: invite.email,
          platformRole: invite.admin ? "admin" : "user",
        })
        .returning({
          id: users.id,
        });

      await tx.insert(passwords).values({
        userId: newUser.id,
        hash: passwordHash.hash,
        salt: passwordHash.salt,
      });

      await tx.delete(invites).where(eq(invites.email, invite.email));
    });
  },
);
