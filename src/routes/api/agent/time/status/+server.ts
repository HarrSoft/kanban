import { eq, and } from "drizzle-orm";
import { json, error } from "@sveltejs/kit";
import db, { timeclocks } from "$db";
import { authenticateAgent } from "../../auth";
import type { RequestHandler } from "../../$types";

/**
 * GET /api/agent/time/status — check the current active timeclock status.
 *
 * Returns the active (unlocked, 0-duration) timeclock for this project,
 * or null if none is running.
 *
 * Response:
 *   { active: Timeclock | null }
 *   where Timeclock = { id, projectId, start, duration, locked, createdAt, updatedAt }
 */
export const GET: RequestHandler = async (event) => {
	const { projectId } = await authenticateAgent(event);

	const [active] = await db
		.select()
		.from(timeclocks)
		.where(
			and(
				eq(timeclocks.projectId, projectId),
				eq(timeclocks.locked, false),
			),
		)
		.orderBy(timeclocks.start)
		.limit(1);

	if (!active) {
		return json({ active: null });
	}

	return json({
		active: {
			id: active.id,
			projectId: active.projectId,
			start: active.start,
			duration: active.duration,
			locked: active.locked,
			createdAt: active.createdAt,
			updatedAt: active.updatedAt,
		},
	});
};
