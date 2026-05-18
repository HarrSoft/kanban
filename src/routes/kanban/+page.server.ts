import db from "$db";
import { boards, projects, columns, cards } from "$db/schema";
import { eq, sql } from "drizzle-orm";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch all boards with column & card counts
	const allBoards = await db
		.select({
			id: boards.id,
			name: boards.name,
			projectId: boards.projectId,
			createdAt: boards.createdAt,
			columnCount: sql<number>`count(distinct ${columns.id})`,
			cardCount: sql<number>`count(distinct ${cards.id})`,
		})
		.from(boards)
		.leftJoin(columns, eq(columns.boardId, boards.id))
		.leftJoin(cards, eq(cards.columnId, columns.id))
		.groupBy(boards.id, boards.name, boards.projectId, boards.createdAt);

	const allProjects = await db.select().from(projects);

	return { boards: allBoards, projects: allProjects };
};

export const actions: Actions = {
	createBoard: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get("name") as string || "").trim();
		const projectId = data.get("projectId") as string;

		if (!name) return { error: "Board name is required" };
		if (!projectId) return { error: "Project is required" };

		await db.insert(boards).values({
			name,
			projectId,
		});

		return { success: true };
	},
};
