import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBoards = [
	{ id: "board1", projectId: "proj1", name: "Test Board 1", columnCount: 2, cardCount: 5 },
	{ id: "board2", projectId: "proj1", name: "Test Board 2", columnCount: 1, cardCount: 0 },
	{ id: "board3", projectId: "proj2", name: "Solo Board", columnCount: 0, cardCount: 0 },
];

// Build a shared ref allow-advancing the select mock on each call.
// First call: db.select({...}).from(boards).leftJoin(...).leftJoin(...).groupBy(...) → mockBoards
// Second call: db.select().from(projects) → mockProjects
let selectReturnIndex = 0;

const mockGroupBy = vi.fn().mockResolvedValue(mockBoards);
const mockSecondLeftJoin = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
const mockFirstLeftJoin = vi.fn().mockReturnValue({ leftJoin: mockSecondLeftJoin });
const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockFirstLeftJoin });

const mockProjectsFrom = vi.fn().mockResolvedValue([
	{ id: "proj1", name: "Project Alpha" },
	{ id: "proj2", name: "Project Beta" },
]);
const mockSelectBare = vi.fn().mockReturnValue({ from: mockProjectsFrom });

vi.mock("$db", () => {
	const selectFn = vi.fn().mockImplementation(() => {
		// First invocation → return the chainable query builder (select({...}))
		// Subsequent invocations → return select().from(projects)
		return selectReturnIndex++ === 0
			? { from: mockFrom }
			: { from: mockProjectsFrom };
	});

	return {
		default: {
			select: selectFn,
		},
	};
});

vi.mock("$db/schema", () => ({
	boards: {},
	projects: {},
	columns: {},
	cards: {},
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
		selectReturnIndex = 0;
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
