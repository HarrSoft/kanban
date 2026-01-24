import * as v from "valibot";
import { PlatformRole, SessionId, UserId } from "./ids";
import { Unix } from "./util";

export const Session = v.object({
  sessionId: SessionId,
  userId: UserId,
  userEmail: v.pipe(v.string(), v.email()),
  platformRole: PlatformRole,
  expiresAt: Unix,
});
export type Session = v.InferOutput<typeof Session>;
