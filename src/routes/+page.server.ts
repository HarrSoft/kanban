import { error, redirect } from "@sveltejs/kit";
import { eq, sql, and } from "drizzle-orm";
import * as df from "date-fns";
import type { Actions } from "./$types";
import db, { projects as projectsTable, projectMembers, boards, columns, timeclocks } from "$db";
import { ProjectId, Timeclock } from "$lib/types";

export async function load(event) {
	const session = event.locals.session;
	if (!session) {
		return { session: null, projects: [], activeProject: null };
	}

	// Get user's projects with member counts
	const userProjectRows = await db
		.select({
			id: projectsTable.id,
			name: projectsTable.name,
			imageUrl: projectsTable.imageUrl,
		})
		.from(projectsTable)
		.innerJoin(projectMembers, eq(projectsTable.id, projectMembers.projectId))
		.where(eq(projectMembers.userId, session.userId));

	if (userProjectRows.length === 0) {
		return {
			session: { userId: session.userId, platformRole: session.platformRole },
			projects: [],
			activeProject: null,
		};
	}

	// Get board counts per project
	const userProjectIds = userProjectRows.map((p) => p.id);

	const boardCounts = await db
		.select({
			projectId: boards.projectId,
			count: sql<number>`cast(count(*) as int)`,
		})
		.from(boards)
		.where(sql`${boards.projectId} in ${userProjectIds}`)
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
		.where(sql`${projectMembers.projectId} in ${userProjectIds}`)
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

	const projectList = userProjectRows.map((p) => ({
		id: p.id,
		name: p.name,
		imageUrl: p.imageUrl,
		boardCount: boardCountMap[p.id] ?? 0,
		memberCount: memberCountMap[p.id] ?? 0,
	}));

	// Get active timeclock for the active project
	let activeTimeclock: Timeclock | null = null;
	if (activeProjectId) {
		const [tc] = await db
			.select()
			.from(timeclocks)
			.where(
				and(
					eq(timeclocks.userId, session.userId),
					eq(timeclocks.projectId, activeProjectId as ProjectId),
					eq(timeclocks.locked, false),
				),
			)
			.orderBy(timeclocks.start)
			.limit(1);

		if (tc) {
			activeTimeclock = {
				id: tc.id,
				projectId: tc.projectId,
				userId: tc.userId,
				start: tc.start,
				duration: tc.duration,
				locked: tc.locked,
			};
		}
	}

	return {
		session: { userId: session.userId, platformRole: session.platformRole },
		projects: projectList,
		activeProject,
		activeTimeclock,
	};
}

export const actions: Actions = {
	createTimeclock: async ({ request, locals }) => {
		const session = locals.session;
		if (!session) {
			throw error(401);
		}

		const data = await request.formData();
		const projectId = data.get("projectId") as string;
		if (!projectId) {
			throw error(400, "projectId is required");
		}

		await db.insert(timeclocks).values({
			projectId: projectId as ProjectId,
			userId: session.userId,
			start: df.getUnixTime(new Date()),
		});

		return { success: true };
	},
};
