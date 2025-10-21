import { z } from "zod";
import { PlatformRole, UserId, UserHandle } from "./ids";

// small stuff, for aggregating a lot of i.e. search results
export const UserInfo = z.object({
  id: UserId,
  handle: UserHandle,
  platformRole: PlatformRole,
  image: z.url().nullable(),
});
export type UserInfo = z.infer<typeof UserInfo>;

// public user information
export const UserProfile = UserInfo.extend({
  verified: z.boolean(),
  bio: z.string().nullable(),
});
export type UserProfile = z.infer<typeof UserProfile>;

// private user info and settings
export const UserFull = UserProfile.extend({});
export type UserFull = z.infer<typeof UserFull>;
