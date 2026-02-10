import * as t from "drizzle-orm/pg-core";
import { LogLevel } from "@harrsoft/logger";
import { LogId, ProjectId } from "$types";
import { projects } from "./projects";
import { id, timestamps } from "./util";

export const logLevel = t.pgEnum("log_level", LogLevel.options);

export const logs = t.pgTable("logs", {
  id: id().primaryKey().$type<LogId>(),
  projectId: t
    .text("project_id")
    .references(() => projects.id)
    .notNull()
    .$type<ProjectId>(),
  logLevel: logLevel("log_level").notNull(),
  service: t.text().notNull(),
  message: t.text().notNull(),
  file: t.text(),
  function: t.text(),
  line: t.integer(),
  column: t.integer(),
  ...timestamps,
});
