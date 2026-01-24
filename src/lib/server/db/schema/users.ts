import * as t from "drizzle-orm/pg-core";
import { Base64Url, PlatformRole, SessionId, UserId } from "$types";
import { id, now, timestamps, unix } from "./util";

export const platformRole = t.pgEnum("platform_role", PlatformRole.options);

export const sessions = t.pgTable("sessions", {
  id: id().primaryKey().$type<SessionId>(),
  userId: t
    .text("user_id")
    .references(() => users.id)
    .notNull()
    .$type<UserId>(),
  expiresAt: unix("expires_at")
    .notNull()
    .$default(() => now() + 30 * 24 * 60 * 60), // +30 days
});

export const users = t.pgTable("users", {
  id: id().primaryKey().$type<UserId>(),
  platformRole: platformRole("platform_role")
    .notNull()
    .default("user")
    .$type<PlatformRole>(),
  email: t.text().unique().notNull(),
  emailVerified: t.timestamp("email_verified"),
  name: t.text(),
  imageUrl: t.text(),
  bio: t.text(),
  ...timestamps,
});

export const passwords = t.pgTable("passwords", {
  userId: t
    .text("user_id")
    .primaryKey()
    .references(() => users.id)
    .notNull()
    .$type<UserId>(),
  hash: t.text("hash").notNull().$type<Base64Url>(),
  salt: t.text("salt").notNull().$type<Base64Url>(),
  ...timestamps,
});

export const invites = t.pgTable("invites", {
  email: t.text().unique().notNull(),
  code: t.text().unique().notNull(),
  platformRole: platformRole("platform_role")
    .notNull()
    .default("user")
    .$type<PlatformRole>(),
  expiresAt: unix("expires_at")
    .notNull()
    .$default(() => now() + 30 * 24 * 60 * 60), // +30 days
});
