import * as t from "drizzle-orm/pg-core";
import { users } from "./users";
import { id, timestamps } from "./util";
import { KeyId, ProjectId, ProjectMemberRole, UserId } from "$types";

export const projects = t.pgTable("projects", {
	id: id().primaryKey().$type<ProjectId>(),
	name: t.text().notNull(),
	imageUrl: t.text(),
	...timestamps,
});

export const projectKeys = t.pgTable("project_keys", {
	keyId: id("key_id").primaryKey().$type<KeyId>(),
	projectId: t
		.text("project_id")
		.references(() => projects.id)
		.notNull()
		.$type<ProjectId>(),
	keyHash: t.text("key_hash").notNull(),
	...timestamps,
});

export const projectMemberRole = t.pgEnum(
	"project_member_role",
	ProjectMemberRole.options,
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
