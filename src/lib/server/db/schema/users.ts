import * as dates from "date-fns";
import * as t from "drizzle-orm/pg-core";
import { id, timestamps } from "./util";
import { PlatformRole, SessionId, Theme, UserId } from "$types";

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
  handle: t.text().unique().notNull(),
  platformRole: platformRole().notNull().default("user").$type<PlatformRole>(),
  email: t.text().unique().notNull(),
  emailVerified: t.timestamp("email_verified"),
  imageUrl: t.text(),
  bio: t.text(),
  theme: theme().notNull().default("auto").$type<Theme>(),
  ...timestamps,
});
