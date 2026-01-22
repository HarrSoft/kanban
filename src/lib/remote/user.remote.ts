import { error, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { form, query } from "$app/server";
import db, { invites, passwords, users } from "$db";
import { hashNewPassword } from "$server/crypto";

////////////////////////////
// fetchInviteEmail query //
////////////////////////////

export const fetchInviteEmail = query(z.string(), async code => {
  const [invite] = await db
    .select({ email: invites.email })
    .from(invites)
    .where(eq(invites.code, code));

  if (!invite) {
    throw error(404, "Invalid code");
  }

  return invite.email;
});

/////////////////////
// createUser form //
/////////////////////

export const createUser = form(
  z.object({
    inviteCode: z.string(),
    name: z.string(),
    _password: z.string(),
  }),
  async ({ inviteCode, name, _password }) => {
    const passwordHash = hashNewPassword(_password);

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
          name: name.trim(),
          platformRole: invite.platformRole,
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

    redirect(303, "/login");
  },
);
