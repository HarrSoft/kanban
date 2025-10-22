import { z } from "zod";
import { PlatformRole, SessionId, UserHandle, UserId } from "./ids";
import { Theme } from "./themes";
import type { Branded } from "./util";

export const Session = z.object({
  sessionId: SessionId,
  userId: UserId,
  userHandle: UserHandle,
  platformRole: PlatformRole,
  sessionExpiresAt: z.date(),
  tokenExpiresAt: z.date(),
  theme: Theme,
});
export type Session = z.infer<typeof Session>;

export const JWT = z.jwt();
export type JWT = Branded<z.infer<typeof JWT>, "JWT">;
