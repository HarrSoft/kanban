import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBoards = [
	{ id: "board1", projectId: "proj1", name: "Test Board 1", columnCount: 2, cardCount: 5 },
	{ id: "board2", projectId: "proj1", name: "Test Board 2", columnCount: 1, cardCount: 0 },
	{ id: "board3", projectId: "proj2", name: "Solo Board", columnCount: 0, cardCount: 0 },
];

const mockArchivedBoards = [
	{ id: "board4", projectId: "proj1", name: "Old Board", columnCount: 1, cardCount: 3 },
];

// We mock the chain:
// select({...}).from(...).leftJoin(...).leftJoin(...).where(...).groupBy(...)
// First call → active boards, second call → archived boards, third call → projects
let selectReturnIndex = 0;

const mockGroupBy = vi.fn().mockResolvedValue(mockBoards);
const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
const mockSecondLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
const mockFirstLeftJoin = vi.fn().mockReturnValue({ leftJoin: mockSecondLeftJoin });
const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockFirstLeftJoin });

// Second select call → archived boards
const mockArchivedGroupBy = vi.fn().mockResolvedValue(mockArchivedBoards);
const mockArchivedWhere = vi.fn().mockReturnValue({ groupBy: mockArchivedGroupBy });
const mockArchivedSecondLeftJoin = vi.fn().mockReturnValue({ where: mockArchivedWhere });
const mockArchivedFirstLeftJoin = vi.fn().mockReturnValue({ leftJoin: mockArchivedSecondLeftJoin });
const mockArchivedFrom = vi.fn().mockReturnValue({ leftJoin: mockArchivedFirstLeftJoin });

// Third select call → projects (bare)
const mockProjectsFrom = vi.fn().mockResolvedValue([
	{ id: "proj1", name: "Project Alpha" },
	{ id: "proj2", name: "Project Beta" },
]);
const mockSelectBare = vi.fn().mockReturnValue({ from: mockProjectsFrom });

vi.mock("$db", () => {
	const selectFn = vi.fn().mockImplementation(() => {
		// First call → active boards query chain
		// Second call → archived boards query chain
		// Third call → projects query
		const idx = selectReturnIndex++;
		if (idx === 0) return { from: mockFrom };
		if (idx === 1) return { from: mockArchivedFrom };
		return { from: mockProjectsFrom };
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
	locals: {
		session: {
			sessionId: "e8u0vgefq61c45dvfp4v7zgj",
			userId: "g6pn2hthq2l5dz7sbs5ocqmm",
			userEmail: "test@harrsoft.coop",
			expiresAt: Math.floor(Date.now() / 1000) + 86400,
			platformRole: "user",
		},
	},
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

	it("redirects to /login when no session", async () => {
		const anonymousEvent = { ...mockEvent, locals: {} };

		await expect(load(anonymousEvent)).rejects.toMatchObject({
			status: 302,
			location: "/login",
		});
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

	it("returns archived boards separately", async () => {
		const result = await load(mockEvent);
		expect(result).toHaveProperty("archivedBoards");
		expect(Array.isArray(result.archivedBoards)).toBe(true);
		expect(result.archivedBoards).toHaveLength(1);
	});
});
