import { json } from "@sveltejs/kit";
import db from "$db";
import { columns, boards } from "$db/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { BoardId, ColumnId } from "$types/ids";
import type { RequestHandler } from "./$types";

const CreateColumnSchema = v.object({
	boardId: v.pipe(v.string("boardId is required"), v.minLength(1, "boardId cannot be empty")),
	name: v.pipe(v.string("name is required"), v.minLength(1, "name cannot be empty")),
});

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.json();

	const parsed = v.safeParse(CreateColumnSchema, raw);
	if (!parsed.success) {
		const issues = parsed.issues.map(i => i.message).join("; ");
		return json({ error: issues }, { status: 400 });
	}

	const { boardId: rawBoardId, name } = parsed.output;

	let boardId: BoardId;
	try {
		boardId = v.parse(BoardId, rawBoardId);
	} catch {
		return json({ error: "Invalid boardId format" }, { status: 400 });
	}

	// Verify board exists
	const board = await db.query.boards.findFirst({
		where: eq(boards.id, boardId),
	});
	if (!board) {
		return json({ error: "Board not found" }, { status: 404 });
	}

	// Get max order in board
	const existingColumns = await db.query.columns.findMany({
		where: eq(columns.boardId, boardId),
	});
	const maxOrder = existingColumns.reduce(
		(max, col) => Math.max(max, col.order),
		-1,
	);

	const [newColumn] = await db
		.insert(columns)
		.values({
			boardId,
			name,
			order: maxOrder + 1,
		})
		.returning();

	return json(newColumn, { status: 201 });
};

/** List columns in a board */
export const GET: RequestHandler = async ({ url }) => {
	const rawBoardId = url.searchParams.get("boardId");

	if (!rawBoardId) {
		return json({ error: "Missing boardId query parameter" }, { status: 400 });
	}

	let boardId: BoardId;
	try {
		boardId = v.parse(BoardId, rawBoardId);
	} catch {
		return json({ error: "Invalid boardId format" }, { status: 400 });
	}

	const boardColumns = await db.query.columns.findMany({
		where: eq(columns.boardId, boardId),
		orderBy: (columns, { asc }) => [asc(columns.order)],
	});

	return json(boardColumns);
};
