import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBoards = [
	{ id: "board1", projectId: "proj1", name: "Test Board 1" },
	{ id: "board2", projectId: "proj1", name: "Test Board 2" },
	{ id: "board3", projectId: "proj2", name: "Solo Board" },
];

// Mock $db to return both boards and projects from select
// The load function does two selects: boards and projects
let selectCallCount = 0;
const mockFrom = vi.fn().mockImplementation(() => {
	const call = selectCallCount++;
	// First select().from(boards) call returns boards, second select().from(projects) returns projects
	if (call === 0) return Promise.resolve(mockBoards);
	return Promise.resolve([
		{ id: "proj1", name: "Project Alpha" },
		{ id: "proj2", name: "Project Beta" },
	]);
});
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock("$db", () => {
	return {
		default: {
			select: mockSelect,
		},
	};
});

vi.mock("$db/schema", () => ({
	boards: {},
	projects: {},
}));

// TypeScript is strict about dynamic imports with .ts extension in svelte-check,
// but this works fine at runtime. Cast to bypass svelte-check's import check.
const mod: Record<string, any> = await import("../+page.server");
const { load } = mod;

// Minimal mock ServerLoadEvent for SvelteKit load function signatures
const mockEvent = {
	url: new URL("http://localhost/kanban"),
	params: {},
	route: { id: "/kanban" },
	request: new Request("http://localhost/kanban"),
	locals: {},
	cookies: {} as any,
	isDataRequest: false,
	platform: undefined,
	depends: () => {},
	fetch: () => Promise.resolve(new Response()),
	parent: () => Promise.resolve({}),
	setHeaders: () => {},
} as any;

describe("kanban list page server load", () => {
	beforeEach(() => {
		selectCallCount = 0;
	});

	it("returns an array of boards", async () => {
		const result = await load(mockEvent);
		expect(result).toHaveProperty("boards");
		expect(Array.isArray(result.boards)).toBe(true);
	});

	it("returns all available boards", async () => {
		const result = await load(mockEvent);
		expect(result.boards).toHaveLength(3);
	});

	it("each board has id, projectId, and name fields", async () => {
		const result = await load(mockEvent);
		for (const board of result.boards) {
			expect(board).toHaveProperty("id");
			expect(board).toHaveProperty("projectId");
			expect(board).toHaveProperty("name");
		}
	});

	it("returns projects alongside boards", async () => {
		const result = await load(mockEvent);
		expect(result).toHaveProperty("projects");
		expect(Array.isArray(result.projects)).toBe(true);
		expect(result.projects).toHaveLength(2);
	});
});
