import { z } from "zod";
import { PlatformRole, SessionId, UserId } from "./ids";

export const Session = z.object({
  sessionId: SessionId,
  userId: UserId,
  userEmail: z.email(),
  platformRole: PlatformRole,
  expiresAt: z.date(),
});
export type Session = z.infer<typeof Session>;
