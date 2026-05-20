import * as t from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { users } from "./users";
import { id, timestamps, unix } from "./util";
import { BoardId, CardAssigneeId, CardId, ColumnId, ProjectId, UserId } from "../../../types"; // drizzle-kit can't handle path aliases

export const boards = t.pgTable("boards", {
	id: id().primaryKey().$type<BoardId>(),
	projectId: t
		.text("project_id")
		.notNull()
		.references(() => projects.id)
		.$type<ProjectId>(),
	name: t.text("name").notNull(),
	description: t.text("description"),
	...timestamps,
});

export const columns = t.pgTable("columns", {
	id: id().primaryKey().$type<ColumnId>(),
	boardId: t
		.text("board_id")
		.notNull()
		.references(() => boards.id, { onDelete: "cascade" })
		.$type<BoardId>(),
	name: t.text("name").notNull(),
	order: t.integer("order").notNull().default(0),
	...timestamps,
});

export const cards = t.pgTable("cards", {
	id: id().primaryKey().$type<CardId>(),
	columnId: t
		.text("column_id")
		.notNull()
		.references(() => columns.id, { onDelete: "cascade" })
		.$type<ColumnId>(),
	content: t.text("content").notNull(),
	order: t.integer("order").notNull().default(0),
	dueDate: unix("due_date"),
	archived: t.boolean("archived").notNull().default(false),
	...timestamps,
});

// Relations
export const boardsRelations = relations(boards, ({ one, many }) => ({
	project: one(projects, {
		fields: [boards.projectId],
		references: [projects.id],
	}),
	columns: many(columns),
}));

export const columnsRelations = relations(columns, ({ one, many }) => ({
	board: one(boards, {
		fields: [columns.boardId],
		references: [boards.id],
	}),
	cards: many(cards),
}));

export const cardAssignees = t.pgTable("card_assignees", {
	id: id().primaryKey().$type<CardAssigneeId>(),
	cardId: t
		.text("card_id")
		.notNull()
		.references(() => cards.id, { onDelete: "cascade" })
		.$type<CardId>(),
	userId: t
		.text("user_id")
		.notNull()
		.references(() => users.id)
		.$type<UserId>(),
	...timestamps,
});

export const cardAssigneesRelations = relations(cardAssignees, ({ one }) => ({
	card: one(cards, {
		fields: [cardAssignees.cardId],
		references: [cards.id],
	}),
	user: one(users, {
		fields: [cardAssignees.userId],
		references: [users.id],
	}),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
	column: one(columns, {
		fields: [cards.columnId],
		references: [columns.id],
	}),
	assignees: many(cardAssignees),
}));

