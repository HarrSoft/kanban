import * as v from "valibot";
import { PlatformRole, UserId } from "./ids";

const userInfoBase = {
  id: UserId,
  name: v.nullable(v.string()),
  email: v.pipe(v.string(), v.email()),
  platformRole: PlatformRole,
  imageUrl: v.nullable(v.pipe(v.string(), v.url())),
};

// small stuff, for aggregating a lot of i.e. search results
export const UserInfo = v.object({
  ...userInfoBase,
});
export type UserInfo = v.InferOutput<typeof UserInfo>;

// public user information
export const UserProfile = v.object({
  ...userInfoBase,
  verified: v.boolean(),
  bio: v.nullable(v.string()),
});
export type UserProfile = v.InferOutput<typeof UserProfile>;

// private user info and settings
export const UserFull = UserProfile;
export type UserFull = v.InferOutput<typeof UserFull>;
