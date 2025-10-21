import * as t from "drizzle-orm/pg-core";
import { users } from "./users";
import { id, timestamps } from "./util";
import { ProjectId, ProjectHandle, ProjectMemberRole, UserId } from "$types";

export const projects = t.pgTable("projects", {
  id: id().primaryKey().$type<ProjectId>(),
  handle: t.text().unique().$type<ProjectHandle>(),
  name: t.text().notNull(),
  ...timestamps,
});

export const projectMemberRole = t.pgEnum(
  "project_member_role",
  ProjectMemberRole.enum,
);

export const projectMembers = t.pgTable(
  "project_members",
  {
    userId: t
      .text("user_id")
      .references(() => users.id)
      .$type<UserId>(),
    projectId: t
      .text("project_id")
      .references(() => projects.id)
      .$type<ProjectId>(),
    role: projectMemberRole(),
    ...timestamps,
  },
  table => [t.primaryKey({ columns: [table.userId, table.projectId] })],
);
