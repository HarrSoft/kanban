import * as df from "date-fns";
import { eq, lt } from "drizzle-orm";
import * as v from "valibot";
import { UTCDateMini } from "@date-fns/utc";
import { error, redirect } from "@sveltejs/kit";
import { form, getRequestEvent, query } from "$app/server";
import db, { invites, passwords, users } from "$db";
import { cuid2, hashNewPassword } from "$server/crypto";
import { PlatformRole, Unix, UserInvite } from "$types";
import { CreateUserSchema } from "./schemas";

////////////////////////////
// fetchInviteEmail query //
////////////////////////////

export const fetchInviteEmail = query(v.string(), async code => {
  const [invite] = await db
    .select({ email: invites.email })
    .from(invites)
    .where(eq(invites.code, code));

  if (!invite) {
    throw error(404, "Invalid code");
  }

  return invite.email;
});

///////////////////////////
// fetchAllInvites query //
///////////////////////////

export const fetchAllInvites = query(async () => {
  const event = getRequestEvent();
  const session = event.locals.session;
  if (!session) {
    throw error(401);
  } else if (session.platformRole !== "admin") {
    throw error(403);
  }

  const inviteRows = await db.transaction(async tx => {
    const unixNow = df.getUnixTime(new UTCDateMini());

    // delete expired invites
    await tx.delete(invites).where(lt(invites.expiresAt, unixNow));

    return tx.select().from(invites);
  });

  const allInvites = v.parse(v.array(UserInvite), inviteRows);

  return allInvites;
});

export const createInvite = form(
  v.object({
    email: v.pipe(v.string(), v.email()),
    platformRole: PlatformRole,
  }),
  async ({ email, platformRole }) => {
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    } else if (session.platformRole !== "admin") {
      throw error(403);
    }

    const code = cuid2();
    const expiresAtDate = df.add(new UTCDateMini(), { days: 30 });
    const expiresAt = df.getUnixTime(expiresAtDate) as Unix;

    await db.insert(invites).values({ code, email, expiresAt, platformRole });

    fetchAllInvites().refresh();
    throw redirect(303, "/admin/invites");
  },
);

///////////////////////
// deleteInvite form //
///////////////////////

export const deleteInvite = form(
  v.object({
    email: v.pipe(v.string(), v.email()),
  }),
  async ({ email }) => {
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    } else if (session.platformRole !== "admin") {
      throw error(403);
    }

    await db.delete(invites).where(eq(invites.email, email));

    fetchAllInvites().refresh();
  },
);

/////////////////////
// createUser form //
/////////////////////

export const createUser = form(
  CreateUserSchema,
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

      const expiryDate = df.fromUnixTime(invite.expiresAt);
      if (df.isPast(expiryDate)) {
        await tx.delete(invites).where(eq(invites.code, invite.code));
        throw error(400, "Code has expired");
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
