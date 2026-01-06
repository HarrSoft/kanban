import { error } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import db, { invites } from "$db";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.code, params.code));

  if (!invite) {
    throw error(404, "Invalid code");
  }

  return {
    email: invite.email,
  };
};
