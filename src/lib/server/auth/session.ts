import * as dates from "date-fns";
import { eq } from "drizzle-orm";
import { type Tx, sessions, users } from "$db";
import { Session, SessionId, UserId } from "$types";
import { deleteSessionTokenCookie } from "./cookie";

export const createSession = async (tx: Tx, userId: UserId) => {
  const [dbSession] = await tx.insert(sessions).values({ userId }).returning();

  const [dbUser] = await tx
    .select({ handle: users.handle })
    .from(users)
    .where(eq(users.id, userId));

  return Session.parse({
    sessionId: dbSession.id,
    userId: dbSession.userId,
    userHandle: dbUser.handle,
    sessionExpiresAt: dbSession.expiresAt,
  } satisfies Session);
};

export const getSession = async (tx: Tx, sessionId: SessionId) => {
  const [dbSession] = await tx
    .select({
      sessionId: sessions.id,
      userId: sessions.userId,
      userHandle: users.handle,
      sessionExpiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sessionId));

  return Session.parse(dbSession satisfies Session);
};

export const extendSession = async (tx: Tx, sessionId: SessionId) => {
  await tx
    .update(sessions)
    .set({ expiresAt: dates.add(new Date(), { days: 30 }) })
    .where(eq(sessions.id, sessionId));
};

export const invalidateSession = async (tx: Tx, sessionId: SessionId) => {
  deleteSessionTokenCookie();
  await tx.delete(sessions).where(eq(sessions.id, sessionId));
};
