import { z } from "zod";
import { PlatformRole, SessionId, UserHandle, UserId } from "./ids";
import { Theme } from "./themes";

export const Session = z.object({
  sessionId: SessionId,
  userId: UserId,
  userHandle: UserHandle,
  platformRole: PlatformRole,
  expiresAt: z.date(),
  theme: Theme,
});
export type Session = z.infer<typeof Session>;
