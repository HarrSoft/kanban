import * as dates from "date-fns";
import * as t from "drizzle-orm/pg-core";
import { Base64Url, PlatformRole, SessionId, Theme, UserId } from "$types";
import { id, timestamps } from "./util";

export const platformRole = t.pgEnum("platform_role", PlatformRole.enum);

export const theme = t.pgEnum("theme", Theme.enum);

export const sessions = t.pgTable("sessions", {
  id: id().primaryKey().$type<SessionId>(),
  userId: t
    .text("user_id")
    .references(() => users.id)
    .notNull()
    .$type<UserId>(),
  expiresAt: t
    .timestamp("expires_at")
    .notNull()
    .$default(() => dates.add(new Date(), { days: 30 })),
});

export const users = t.pgTable("users", {
  id: id().primaryKey().$type<UserId>(),
  platformRole: platformRole("platform_role")
    .notNull()
    .default("viewer")
    .$type<PlatformRole>(),
  email: t.text().unique().notNull(),
  emailVerified: t.timestamp("email_verified"),
  name: t.text(),
  imageUrl: t.text(),
  bio: t.text(),
  theme: theme().notNull().default("auto").$type<Theme>(),
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
    .default("viewer")
    .$type<PlatformRole>(),
  admin: t.boolean().notNull().default(false),
});
