/**
 * Unit tests for the kanban DB schema (boards, columns, cards).
 *
 * Tests check table/column configuration via drizzle-orm/pg-core metadata.
 * These are structural tests — they do not require a database connection.
 */

import { describe, it, expect } from "vitest";
import { boards, columns, cards } from "./kanban";

describe("boards table", () => {
	it("is defined", () => {
		expect(boards).toBeDefined();
	});

	it("has id, projectId, and name columns", () => {
		expect(boards.id).toBeDefined();
		expect(boards.projectId).toBeDefined();
		expect(boards.name).toBeDefined();
	});

	it("has createdAt, updatedAt, deletedAt timestamps", () => {
		expect(boards.createdAt).toBeDefined();
		expect(boards.updatedAt).toBeDefined();
		expect(boards.deletedAt).toBeDefined();
	});

	it("name is not null", () => {
		expect(boards.name.config.notNull).toBe(true);
	});

	it("projectId column config name is project_id", () => {
		expect(boards.projectId.config.name).toBe("project_id");
	});
});

describe("columns table", () => {
	it("is defined", () => {
		expect(columns).toBeDefined();
	});

	it("has id, boardId, name, and order columns", () => {
		expect(columns.id).toBeDefined();
		expect(columns.boardId).toBeDefined();
		expect(columns.name).toBeDefined();
		expect(columns.order).toBeDefined();
	});

	it("order has a default value of 0", () => {
		expect(columns.order.config.hasDefault).toBe(true);
		expect(columns.order.config.default).toBe(0);
		expect(columns.order.config.dataType).toBe("number");
	});

	it("order config name is order", () => {
		expect(columns.order.config.name).toBe("order");
	});

	it("boardId column config name is board_id", () => {
		expect(columns.boardId.config.name).toBe("board_id");
	});

	it("has createdAt, updatedAt, deletedAt timestamps", () => {
		expect(columns.createdAt).toBeDefined();
		expect(columns.updatedAt).toBeDefined();
		expect(columns.deletedAt).toBeDefined();
	});
});

describe("cards table", () => {
	it("is defined", () => {
		expect(cards).toBeDefined();
	});

	it("has id, columnId, content, and order columns", () => {
		expect(cards.id).toBeDefined();
		expect(cards.columnId).toBeDefined();
		expect(cards.content).toBeDefined();
		expect(cards.order).toBeDefined();
	});

	it("content is not null", () => {
		expect(cards.content.config.notNull).toBe(true);
	});

	it("order has a default value of 0", () => {
		expect(cards.order.config.hasDefault).toBe(true);
		expect(cards.order.config.default).toBe(0);
		expect(cards.order.config.dataType).toBe("number");
	});

	it("columnId column config name is column_id", () => {
		expect(cards.columnId.config.name).toBe("column_id");
	});

	it("content column config name is content", () => {
		expect(cards.content.config.name).toBe("content");
	});
});

