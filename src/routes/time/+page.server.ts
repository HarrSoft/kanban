import db from "$db";
import { projectMembers } from "$db/schema";
import { timeclocks } from "$db/schema/timeclocks";
import { and, eq } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { ProjectId, Timeclock, UserId } from "$types";

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals?.session;
	if (!session?.user?.id) {
		redirect(302, "/login");
	}

	const userId = session.user.id as UserId;

	// Get the user's active project (first project they're a member of)
	const membership = await db.query.projectMembers.findFirst({
		where: eq(projectMembers.userId, userId),
		with: {
			project: true,
		},
	});

	if (!membership) {
		return {
			activeProject: null,
			timeclocks: [],
			totalDurationToday: 0,
			totalDurationThisWeek: 0,
		};
	}

	const activeProject = membership.project;

	// Fetch user's timeclocks for this project
	const userClocks = (await db.query.timeclocks.findMany({
		where: and(
			eq(timeclocks.userId, userId),
			eq(timeclocks.projectId, activeProject.id as ProjectId),
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
		activeProject,
		timeclocks: userClocks,
		totalDurationToday,
		totalDurationThisWeek,
	};
};
