import * as df from "date-fns";
import { count, eq } from "drizzle-orm";
import type { Handle, ServerInit } from "@sveltejs/kit";
import db, { invites, users } from "$db";
import { handle as authHandle } from "$server/auth/handle";

export const handle: Handle = authHandle;

// create first user if there are none
export const init: ServerInit = () =>
  db.transaction(async tx => {
    const [userRows] = await tx.select({ count: count() }).from(users);

    const [adminInviteRows] = await tx
      .select({ count: count() })
      .from(invites)
      .where(eq(invites.platformRole, "admin"));

    if (userRows?.count === 0 && adminInviteRows?.count === 0) {
      await tx.insert(invites).values({
        email: "admin@example.com",
        code: "admin",
        platformRole: "admin",
        expiresAt: df.getUnixTime(df.add(new Date(), { years: 10 })),
      });
    }
  });
