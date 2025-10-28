import * as date from "date-fns";
import type { Handle } from "@sveltejs/kit";
import db from "$db";
import { Session } from "$types";
import {
  getSessionTokenCookie,
  setSessionTokenCookie,
  deleteSessionTokenCookie,
} from "./cookie";
import { getSession, extendSession, invalidateSession } from "./session";
import { createToken, validateToken } from "./token";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.session = null;

  // get token from cookie
  const encToken = getSessionTokenCookie();
  if (!encToken) {
    // continue as unauthorized request
    return resolve(event);
  }

  // validate token
  const tokenRes = validateToken(encToken);
  if (!tokenRes.valid) {
    console.error("[Auth] Invalid token:", tokenRes.error);

    if (tokenRes.error === "signature") {
      // kill suspicious session
      await invalidateSession(db, tokenRes.sessionId);
    } else {
      // just delete bad token
      deleteSessionTokenCookie();
    }

    // continue as unauthorized request
    return resolve(event);
  }

  // check token expiration
  const tokenHasExpired = date.isPast(tokenRes.tokenExp);

  if (!tokenHasExpired) {
    event.locals.session = tokenRes.session;
    return resolve(event);
  }

  // if token has expired, try the database session
  const session: Session | null = await db.transaction(async tx => {
    const dbSession = await getSession(tx, tokenRes.session.sessionId);

    if (!dbSession) {
      deleteSessionTokenCookie();
      return null;
    }

    // check for expiration
    if (date.isPast(dbSession.expiresAt)) {
      await invalidateSession(tx, dbSession.sessionId);
      return null;
    }

    // extend session if less than half duration remains
    const extensionDate = date.add(new Date(), { days: 15 });
    if (date.isBefore(dbSession.expiresAt, extensionDate)) {
      await extendSession(tx, dbSession.sessionId);
    }

    return dbSession;
  });

  if (!session) {
    return resolve(event);
  }

  // issue new token
  const newToken = createToken(session);
  setSessionTokenCookie(newToken);
  event.locals.session = session;

  return resolve(event);
};
