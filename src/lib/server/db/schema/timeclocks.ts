import * as t from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";
import { id, seconds, timestamps, unix } from "./util";
import { ProjectId, TimeclockId, UserId } from "$types";

export const timeclocks = t.pgTable("timeclocks", {
  id: id().primaryKey().$type<TimeclockId>(),
  userId: t
    .text("user_id")
    .references(() => users.id)
    .notNull()
    .$type<UserId>(),
  projectId: t
    .text("project_id")
    .references(() => projects.id)
    .notNull()
    .$type<ProjectId>(),
  start: unix().notNull(),
  duration: seconds().notNull().default(0),
  locked: t.boolean().notNull().default(false),
  ...timestamps,
});
