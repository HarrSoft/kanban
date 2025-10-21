import { z } from "zod";
import { PlatformRole, SessionId, UserHandle, UserId } from "./ids";
import type { Branded } from "./util";

export const Session = z.object({
  sessionId: SessionId,
  userId: UserId,
  userHandle: UserHandle,
  platformRole: PlatformRole,
  sessionExpiresAt: z.date(),
});
export type Session = z.infer<typeof Session>;

export const JWT = z.jwt();
export type JWT = Branded<z.infer<typeof JWT>, "JWT">;
