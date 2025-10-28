import { z } from "zod";
import { PlatformRole, SessionId, UserHandle, UserId } from "./ids";
import { Theme } from "./themes";

export const DBSession = z.object({
  sessionId: SessionId,
  userId: UserId,
  userHandle: UserHandle,
  platformRole: PlatformRole,
  sessionExpiresAt: z.date(),
  theme: Theme,
});
export type DBSession = z.infer<typeof DBSession>;

export const Session = DBSession.extend({
  tokenExpiresAt: z.date(),
});
export type Session = z.infer<typeof Session>;
