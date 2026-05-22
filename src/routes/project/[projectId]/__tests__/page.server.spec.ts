import { describe, it, expect, vi, beforeEach } from "vitest";

const mockBoards = [
	{
		id: "board1",
		projectId: "proj1",
		name: "Test Board 1",
		columnCount: 2,
		cardCount: 5,
		lastActivity: 1700000000,
	},
	{
		id: "board2",
		projectId: "proj1",
		name: "Test Board 2",
		columnCount: 1,
		cardCount: 0,
		lastActivity: null,
	},
];

const mockArchivedCount = [{ count: 3 }];

// Mock the DB query chain: select({...}).from(...).leftJoin(...).leftJoin(...).where(...).groupBy(...).orderBy(...)
let selectCallIndex = 0;

const mockOrderBy = vi.fn().mockResolvedValue(mockBoards);
const mockGroupBy = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
const mockSecondLeftJoin = vi.fn().mockReturnValue({ where: mockWhere });
const mockFirstLeftJoin = vi.fn().mockReturnValue({ leftJoin: mockSecondLeftJoin });
const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockFirstLeftJoin });

// Second select call → archived count (select count)
const mockArchivedWhere = vi.fn().mockResolvedValue(mockArchivedCount);
const mockArchivedFrom = vi.fn().mockReturnValue({ where: mockArchivedWhere });

vi.mock("$db", () => {
	const selectFn = vi.fn().mockImplementation(() => {
		// First call → active boards query chain
		// Second call → archived count query
		const idx = selectCallIndex++;
		if (idx === 0) return { from: mockFrom };
		return { from: mockArchivedFrom };
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

const mod: Record<string, any> = await import("../+page.server");
const { load } = mod;

// Minimal mock ServerLoadEvent for SvelteKit load function signatures
const mockEvent = {
	url: new URL("http://localhost/project/proj1"),
	params: { projectId: "proj1" },
	route: { id: "/project/[projectId]" },
	request: new Request("http://localhost/project/proj1"),
	locals: { session: { user: { id: "user1" } } },
	cookies: {} as any,
	isDataRequest: false,
	platform: undefined,
	depends: () => {},
	fetch: () => Promise.resolve(new Response()),
	parent: () => Promise.resolve({}),
	setHeaders: () => {},
} as any;

const mockEventNoSession = {
	...mockEvent,
	locals: {},
} as any;

describe("project detail page server load", () => {
	beforeEach(() => {
		selectCallIndex = 0;
	});

	it("throws 401 when not authenticated", async () => {
		try {
			await load(mockEventNoSession);
			// If we reach here, no error was thrown — fail
			expect.fail("Expected 401 error");
		} catch (e: any) {
			expect(e.status).toBe(401);
			expect(e.body.message).toBe("Must be logged in");
		}
	});

	it("returns a boards array", async () => {
		const result = await load(mockEvent);
		expect(result).toHaveProperty("boards");
		expect(Array.isArray(result.boards)).toBe(true);
	});

	it("returns all available boards for the project", async () => {
		const result = await load(mockEvent);
		expect(result.boards).toHaveLength(2);
	});

	it("each board has id, projectId, name, and stats fields", async () => {
		const result = await load(mockEvent);
		for (const board of result.boards) {
			expect(board).toHaveProperty("id");
			expect(board).toHaveProperty("projectId");
			expect(board).toHaveProperty("name");
			expect(board).toHaveProperty("columnCount");
			expect(board).toHaveProperty("cardCount");
		}
	});

	it("includes lastActivity timestamp on boards", async () => {
		const result = await load(mockEvent);
		expect(result.boards[0]).toHaveProperty("lastActivity");
		expect(result.boards[0].lastActivity).toBe(1700000000);
	});

	it("lastActivity can be null for inactive boards", async () => {
		const result = await load(mockEvent);
		expect(result.boards[1].lastActivity).toBeNull();
	});

	it("returns archivedBoardCount", async () => {
		const result = await load(mockEvent);
		expect(result).toHaveProperty("archivedBoardCount");
	});

	it("archivedBoardCount is the correct number", async () => {
		const result = await load(mockEvent);
		expect(result.archivedBoardCount).toBe(3);
	});
});
