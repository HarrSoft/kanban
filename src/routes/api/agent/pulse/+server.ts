import { asc, isNull, and, eq } from "drizzle-orm";
import { json } from "@sveltejs/kit";
import db, { cards, columns, boards } from "$db";
import { authenticateAgent } from "../auth";
import type { RequestHandler } from "../$types";

/** GET /api/agent/pulse — get the current priority item for this project.
 *
 * Priority heuristic (in order):
 * 1. Cards with due dates, ordered by soonest first (nulls last)
 * 2. Non-archived cards only
 * 3. Only from this project's boards
 *
 * Returns the single most urgent card, or empty if none.
 */
export const GET: RequestHandler = async (event) => {
	const { projectId } = await authenticateAgent(event);

	// find the most urgent non-archived card across all boards in this project
	const [pulse] = await db
		.select({
			id: cards.id,
			content: cards.content,
			dueDate: cards.dueDate,
			columnName: columns.name,
			boardName: boards.name,
		})
		.from(cards)
		.innerJoin(columns, eq(cards.columnId, columns.id))
		.innerJoin(boards, eq(columns.boardId, boards.id))
		.where(
			and(
				eq(boards.projectId, projectId),
				eq(cards.archived, false),
			),
		)
		.orderBy(asc(cards.dueDate)) // nulls last
		.limit(1);

	if (!pulse) {
		return json({ task: null });
	}

	return json({
		task: {
			id: pulse.id,
			content: pulse.content,
			dueAt: pulse.dueDate,
			column: pulse.columnName,
			board: pulse.boardName,
			type: "kanban",
		},
	});
};
