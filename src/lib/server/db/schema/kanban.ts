import * as t from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { projects } from "./projects";
import { id, timestamps } from "./util";
import { BoardId, ColumnId, CardId, ProjectId } from "$types/ids";

export const boards = t.pgTable("boards", {
    id: id().primaryKey().$type<BoardId>(),
    projectId: t
        .text("project_id")
        .notNull()
        .references(() => projects.id)
        .$type<ProjectId>(),
    name: t.text("name").notNull(),
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

export const cardsRelations = relations(cards, ({ one }) => ({
    column: one(columns, {
        fields: [cards.columnId],
        references: [columns.id],
    }),
}));
