import { json } from "@sveltejs/kit";
import { eq, sql } from "drizzle-orm";
import db, { boards, projects } from "$db";
import { authenticateAgent } from "../auth";
import type { RequestHandler } from "../$types";

/**
 * GET /api/agent/projects — list accessible projects for this agent key.
 *
 * Returns a list of projects that the authenticated agent key has access to
 * (via project_keys). Each project includes basic info and board counts.
 *
 * Response: { projects: ProjectSummary[] }
 */
export const GET: RequestHandler = async (event) => {
	const { projectId } = await authenticateAgent(event);

	// Load the project and its board stats in one query
	const rows = await db
		.select({
			id: projects.id,
			name: projects.name,
			imageUrl: projects.imageUrl,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
			boardCount: sql<number>`count(${boards.id})::int`,
			activeBoardCount:
				sql<number>`count(*) filter (where ${boards.archived} = false)::int`,
		})
		.from(projects)
		.leftJoin(boards, eq(boards.projectId, projects.id))
		.where(eq(projects.id, projectId))
		.groupBy(projects.id)
		.limit(1);

	if (rows.length === 0) {
		return json({ projects: [] });
	}

	const row = rows[0];
	const project = {
		id: row.id,
		name: row.name,
		imageUrl: row.imageUrl,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		stats: {
			totalBoards: Number(row.boardCount),
			activeBoards: Number(row.activeBoardCount),
		},
	};

	return json({ projects: [project] });
};
