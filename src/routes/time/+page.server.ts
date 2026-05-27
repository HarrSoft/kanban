import db from "$db";
import { projectMembers, projects } from "$db/schema";
import { timeclocks } from "$db/schema/timeclocks";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { ProjectId, Timeclock, UserId } from "$types";

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals?.session;
	if (!session?.userId) {
		redirect(302, "/login");
	}

	const userId = session.userId as UserId;

	// Get all projects the user is a member of
	const memberships = await db.query.projectMembers.findMany({
		where: eq(projectMembers.userId, userId),
		with: {
			project: true,
		},
	});

	const userProjects = memberships.map(m => m.project);

	if (userProjects.length === 0) {
		return {
			userProjects: [],
			selectedProjectId: null,
			timeclocks: [],
			totalDurationToday: 0,
			totalDurationThisWeek: 0,
		};
	}

	// Determine which project to show
	const projectParam = url.searchParams.get("project");
	const selectedProjectId = (projectParam && userProjects.some(p => p.id === projectParam))
		? (projectParam as ProjectId)
		: (userProjects[0].id as ProjectId);

	const selectedProject = userProjects.find(p => p.id === selectedProjectId)!;

	// Fetch user's timeclocks for the selected project
	const userClocks = (await db.query.timeclocks.findMany({
		where: and(
			eq(timeclocks.userId, userId),
			eq(timeclocks.projectId, selectedProjectId),
		),
		orderBy: (clocks, { desc }) => [desc(clocks.start)],
	})) as Timeclock[];

	// Calculate today's total
	const now = Math.floor(Date.now() / 1000);
	const todayStart = now - (now % 86400); // start of current UTC day
	const weekStart = todayStart - 6 * 86400; // 7 days including today

	const todayClocks = userClocks.filter(c => c.start >= todayStart);
	const weekClocks = userClocks.filter(c => c.start >= weekStart);

	const totalDurationToday = todayClocks.reduce((sum, c) => sum + c.duration, 0);
	const totalDurationThisWeek = weekClocks.reduce((sum, c) => sum + c.duration, 0);

	return {
		userProjects,
		selectedProjectId,
		timeclocks: userClocks,
		totalDurationToday,
		totalDurationThisWeek,
	};
};
