import db from "$db";
import { boards, projects } from "$db/schema";
import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch all boards and projects for the creation form
	const allBoards = await db.select().from(boards);
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
