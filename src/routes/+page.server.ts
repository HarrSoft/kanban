import { error } from "@sveltejs/kit";
import { eq, sql } from "drizzle-orm";
import db, { projects, projectMembers, boards, columns } from "$db";
import type { ProjectId } from "$types";

export async function load(event) {
	const session = event.locals.session;
	if (!session) {
		return { session: null, projects: [], activeProject: null };
	}

	// Get user's projects with member counts
	const userProjectRows = await db
		.select({
			id: projects.id,
			name: projects.name,
			imageUrl: projects.imageUrl,
		})
		.from(projects)
		.innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
		.where(eq(projectMembers.userId, session.userId));

	if (userProjectRows.length === 0) {
		return {
			session: { userId: session.userId, platformRole: session.platformRole },
			projects: [],
			activeProject: null,
		};
	}

	// Get board counts per project
	const projectIds = userProjectRows.map((p) => p.id);

	const boardCounts = await db
		.select({
			projectId: boards.projectId,
			count: sql<number>`cast(count(*) as int)`,
		})
		.from(boards)
		.where(sql`${boards.projectId} in ${projectIds}`)
		.groupBy(boards.projectId);

	const boardCountMap: Record<string, number> = {};
	for (const row of boardCounts) {
		boardCountMap[row.projectId] = row.count;
	}

	// Get member counts per project
	const memberCounts = await db
		.select({
			projectId: projectMembers.projectId,
			count: sql<number>`cast(count(*) as int)`,
		})
		.from(projectMembers)
		.where(sql`${projectMembers.projectId} in ${projectIds}`)
		.groupBy(projectMembers.projectId);

	const memberCountMap: Record<string, number> = {};
	for (const row of memberCounts) {
		memberCountMap[row.projectId] = row.count;
	}

	// Get active project from cookie
	const activeProjectId = event.cookies.get("activeProject") as
		| ProjectId
		| undefined;
	const activeProject =
		activeProjectId && userProjectRows.some((p) => p.id === activeProjectId)
			? (userProjectRows.find((p) => p.id === activeProjectId) ?? null)
			: null;

	const projects = userProjectRows.map((p) => ({
		id: p.id,
		name: p.name,
		imageUrl: p.imageUrl,
		boardCount: boardCountMap[p.id] ?? 0,
		memberCount: memberCountMap[p.id] ?? 0,
	}));

	return {
		session: { userId: session.userId, platformRole: session.platformRole },
		projects,
		activeProject,
	};
}
