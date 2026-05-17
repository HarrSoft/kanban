import { describe, it, expect, vi } from "vitest";

const mockBoards = [
	{ id: "board1", projectId: "proj1", name: "Test Board 1" },
	{ id: "board2", projectId: "proj1", name: "Test Board 2" },
	{ id: "board3", projectId: "proj2", name: "Solo Board" },
];

// Mock $db to match Drizzle's chained API: db.select().from(table)
const mockFrom = vi.fn().mockResolvedValue(mockBoards);
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock("$db", () => {
	return {
		default: {
			select: mockSelect,
		},
		// Named export for the boards table object
		boards: {},
	};
});

vi.mock("$db/schema", () => ({
	boards: {},
}));

const mod = await import("../+page.server.ts");
const { load } = mod;

describe("kanban list page server load", () => {
	it("returns an array of boards", async () => {
		const result = await load();
		expect(result).toHaveProperty("boards");
		expect(Array.isArray(result.boards)).toBe(true);
	});

	it("returns all available boards", async () => {
		const result = await load();
		expect(result.boards).toHaveLength(3);
	});

	it("each board has id, projectId, and name fields", async () => {
		const result = await load();
		for (const board of result.boards) {
			expect(board).toHaveProperty("id");
			expect(board).toHaveProperty("projectId");
			expect(board).toHaveProperty("name");
		}
	});
});
