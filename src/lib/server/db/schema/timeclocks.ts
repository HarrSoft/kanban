import * as t from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";
import { id, timestamps } from "./util";
import { ProjectId, TimeclockId, UserId } from "$types";

export const timeclocks = t.pgTable("timeclocks", {
  id: id().primaryKey().$type<TimeclockId>(),
  userId: t
    .text("user_id")
    .references(() => users.id)
    .$type<UserId>(),
  projectId: t
    .text("project_id")
    .references(() => projects.id)
    .$type<ProjectId>(),
  start: t.date().notNull().defaultNow(),
  duration: t.integer(), // seconds
  ...timestamps,
});
