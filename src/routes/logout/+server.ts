import { redirect } from "@sveltejs/kit";
import db from "$db";
import { deleteSessionTokenCookie } from "$server/auth/cookie";
import { invalidateSession } from "$server/auth/session";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
  if (locals.session) {
    await invalidateSession(db, locals.session.sessionId);
    deleteSessionTokenCookie();
  }

  return redirect(303, "/");
};
