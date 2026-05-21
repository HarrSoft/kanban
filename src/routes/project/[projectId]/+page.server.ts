import { error } from "@sveltejs/kit";
import db from "$db";
import { boards, columns, cards } from "$db/schema";
import { eq, sql, asc, and } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		error(401, "Must be logged in");
	}

	const projectId = params.projectId;

	// Fetch non-archived boards for this project with column & card counts
	const projectBoards = await db
		.select({
			id: boards.id,
			name: boards.name,
			description: boards.description,
			createdAt: boards.createdAt,
			columnCount: sql<number>`count(distinct ${columns.id})`,
			cardCount: sql<number>`count(distinct ${cards.id})`,
		})
		.from(boards)
		.leftJoin(columns, eq(columns.boardId, boards.id))
		.leftJoin(cards, eq(cards.columnId, columns.id))
		.where(and(
			eq(boards.projectId, projectId),
			eq(boards.archived, false),
		))
		.groupBy(boards.id, boards.name, boards.description, boards.createdAt)
		.orderBy(asc(boards.createdAt));

	return { boards: projectBoards };
};
