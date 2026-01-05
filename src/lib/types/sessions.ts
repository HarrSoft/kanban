import { z } from "zod";
import { PlatformRole, SessionId, UserId } from "./ids";
import { Theme } from "./themes";

export const Session = z.object({
  sessionId: SessionId,
  userId: UserId,
  userEmail: z.email(),
  platformRole: PlatformRole,
  expiresAt: z.date(),
  theme: Theme,
});
export type Session = z.infer<typeof Session>;
