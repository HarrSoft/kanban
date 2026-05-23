import * as df from "date-fns";
import { eq, and } from "drizzle-orm";
import { json, error } from "@sveltejs/kit";
import db, { timeclocks, projectMembers } from "$db";
import { authenticateAgent } from "../../auth";
import {
	getIdempotencyResponse,
	recordIdempotencyResult,
	sendIdempotencyResponse,
} from "../../idempotency";
import type { RequestHandler } from "../../$types";

/**
 * Look up the first admin member of a project (for agent-scoped timeclock).
 * Agent API keys are scoped to projects, not users, so we resolve the user
 * from the project's admin membership.
 */
async function getAgentUserId(projectId: string): Promise<string | null> {
	const [member] = await db
		.select({ userId: projectMembers.userId })
		.from(projectMembers)
		.where(
			and(
				eq(projectMembers.projectId, projectId),
				eq(projectMembers.role, "admin"),
			),
		)
		.limit(1);
	return member?.userId ?? null;
}

/**
 * POST /api/agent/time/log — log time against a project (start or stop a clock).
 *
 * Idempotent: supports Idempotency-Key header for safe retries.
 *
 * Request body:
 *   action: "start" | "stop"
 *   startedAt?: unix timestamp (for "start", defaults to now)
 *   duration?: seconds (for "stop", defaults to elapsed time from start)
 *
 * Response:
 *   { timeclock: { id, projectId, start, duration, locked } }
 */
export const POST: RequestHandler = async (event) => {
	const auth = await authenticateAgent(event);

	// Idempotency check
	const idempotencyKey = event.request.headers.get("Idempotency-Key");
	const cached = await getIdempotencyResponse(
		auth,
		"POST",
		"/api/agent/time/log",
		idempotencyKey,
	);
	if (cached) {
		return sendIdempotencyResponse(cached);
	}

	const body = await event.request.json().catch(() => ({}));
	const action = body.action as string | undefined;

	if (!action || !["start", "stop"].includes(action)) {
		throw error(400, "action must be 'start' or 'stop'");
	}

	const now = df.getUnixTime(new Date());

	if (action === "start") {
		// Check no active clock already exists for this project
		const [activeClock] = await db
			.select({ id: timeclocks.id })
			.from(timeclocks)
			.where(
				and(
					eq(timeclocks.projectId, auth.projectId),
					eq(timeclocks.duration, 0),
				),
			)
			.limit(1);

		if (activeClock) {
			const result = {
				error: "Active timeclock already exists for this project",
				code: "CLOCK_ALREADY_ACTIVE",
			};
			return json(result, { status: 409 });
		}

		const startedAt =
			typeof body.startedAt === "number" ? body.startedAt : now;

		// Resolve user from project membership (agent keys are project-scoped)
		const agentUserId = await getAgentUserId(auth.projectId);
		if (!agentUserId) {
			throw error(
				400,
				"No admin member found for this project. Ensure the project has at least one member with the admin role.",
			);
		}

		const [tc] = await db
			.insert(timeclocks)
			.values({
				projectId: auth.projectId,
				userId: agentUserId,
				start: startedAt,
			})
			.returning();

		const responseBody = {
			timeclock: {
				id: tc.id,
				projectId: tc.projectId,
				start: tc.start,
				duration: tc.duration,
				locked: tc.locked,
				createdAt: tc.createdAt,
				updatedAt: tc.updatedAt,
			},
		};

		// Record idempotent response
		if (idempotencyKey) {
			await recordIdempotencyResult(
				auth,
				"POST",
				"/api/agent/time/log",
				idempotencyKey,
				200,
				responseBody,
			);
		}

		return json(responseBody, { status: 200 });
	}

	// action === "stop"
	// Find the active (unlocked, 0-duration) clock for this project
	const [activeClock] = await db
		.select()
		.from(timeclocks)
		.where(
			and(
				eq(timeclocks.projectId, auth.projectId),
				eq(timeclocks.locked, false),
			),
		)
		.orderBy(timeclocks.start)
		.limit(1);

	if (!activeClock) {
		const result = {
			error: "No active timeclock found for this project",
			code: "NO_ACTIVE_CLOCK",
		};
		return json(result, { status: 404 });
	}

	const duration =
		typeof body.duration === "number" && body.duration > 0
			? body.duration
			: now - activeClock.start;

	const [updated] = await db
		.update(timeclocks)
		.set({ duration })
		.where(eq(timeclocks.id, activeClock.id))
		.returning();

	const responseBody = {
		timeclock: {
			id: updated.id,
			projectId: updated.projectId,
			start: updated.start,
			duration: updated.duration,
			locked: updated.locked,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		},
	};

	// Record idempotent response
	if (idempotencyKey) {
		await recordIdempotencyResult(
			auth,
			"POST",
			"/api/agent/time/log",
			idempotencyKey,
			200,
			responseBody,
		);
	}

	return json(responseBody, { status: 200 });
};
