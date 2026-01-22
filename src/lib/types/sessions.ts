import * as v from "valibot";
import { PlatformRole, SessionId, UserId } from "./ids";

export const Session = v.object({
  sessionId: SessionId,
  userId: UserId,
  userEmail: v.pipe(v.string(), v.email()),
  platformRole: PlatformRole,
  expiresAt: v.date(),
});
export type Session = v.InferOutput<typeof Session>;
