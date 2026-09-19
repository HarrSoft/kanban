import { json, error } from "@sveltejs/kit";
import { eq, and } from "drizzle-orm";
import db, { boards, columns, cards } from "$db";
import { authenticateAgent } from "../../auth";
import {
	getIdempotencyResponse,
	recordIdempotencyResult,
	sendIdempotencyResponse,
} from "../../idempotency";
import { validateCardUpdate } from "../update-schema";
import type { RequestHandler } from "./$types";

/**
 * PATCH /api/agent/cards/[cardId] — update a card the agent's project owns.
 *
 * The missing write-half of the agent API. Before this route an agent-created
 * card was write-once from the agent's hand: `POST /api/agent/cards` creates,
 * `GET /api/agent/tasks` lists, and there was no agent-auth route to update,
 * move, or close one. The only path was the board's unauthenticated page form
 * action — which, for an unknown id, wrote 0 rows, returned success, and then
 * crashed the server on a foreign-key violation when it logged activity.
 *
 * This route closes both halves of that hole: an update that can't touch a card
 * the project doesn't own (scoped card -> column -> board.projectId), and a
 * missing or foreign id that returns a clean 404 instead of a false success or
 * a crash.
 *
 * Idempotent: supports the Idempotency-Key header for safe retries.
 *
 * Request body (JSON) — at least one field:
 *   content   — string (≤500)   — card body
 *   columnId  — string          — move the card to this column (must be in project)
 *   order     — integer         — position within the column
 *   archived  — boolean         — true closes/archives the card
 *   priority  — low|medium|high|urgent
 *   dueDate   — unix seconds | null
 *
 * Returns the updated card.
 */
export const PATCH: RequestHandler = async event => {
	const auth = await authenticateAgent(event);
	const cardId = event.params.cardId;
	const path = `/api/agent/cards/${cardId}`;

	// Idempotency check
	const idempotencyKey = event.request.headers.get("Idempotency-Key");
	const cached = await getIdempotencyResponse(
		auth,
		"PATCH",
		path,
		idempotencyKey,
	);
	if (cached) {
		return sendIdempotencyResponse(cached);
	}

	const raw = await event.request.json().catch(() => ({}));
	const parsed = validateCardUpdate(raw);
	if (!parsed.ok) {
		throw error(400, parsed.error);
	}
	const patch = parsed.patch;

	// Scope the card to the agent's project: card -> column -> board.projectId.
	// A card the project does not own is indistinguishable from a missing one.
	const [existing] = await db
		.select({ id: cards.id })
		.from(cards)
		.innerJoin(columns, eq(cards.columnId, columns.id))
		.innerJoin(boards, eq(columns.boardId, boards.id))
		.where(
			and(
				eq(cards.id, cardId as never),
				eq(boards.projectId, auth.projectId as never),
			),
		)
		.limit(1);

	if (!existing) {
		throw error(404, "Card not found or not accessible");
	}

	// If moving, the destination column must belong to an active board in the project.
	if (patch.columnId !== undefined) {
		const [dest] = await db
			.select({ id: columns.id })
			.from(columns)
			.innerJoin(boards, eq(columns.boardId, boards.id))
			.where(
				and(
					eq(columns.id, patch.columnId as never),
					eq(boards.projectId, auth.projectId as never),
					eq(boards.archived, false),
				),
			)
			.limit(1);
		if (!dest) {
			throw error(404, "Destination column not found or not accessible");
		}
	}

	const updates: Record<string, unknown> = {};
	if (patch.content !== undefined) updates.content = patch.content;
	if (patch.columnId !== undefined) updates.columnId = patch.columnId;
	if (patch.order !== undefined) updates.order = patch.order;
	if (patch.archived !== undefined) updates.archived = patch.archived;
	if (patch.priority !== undefined) updates.priority = patch.priority;
	if (patch.dueDate !== undefined) updates.dueDate = patch.dueDate;

	const [updated] = await db
		.update(cards)
		.set(updates)
		.where(eq(cards.id, cardId as never))
		.returning({
			id: cards.id,
			columnId: cards.columnId,
			content: cards.content,
			priority: cards.priority,
			order: cards.order,
			dueDate: cards.dueDate,
			archived: cards.archived,
			updatedAt: cards.updatedAt,
		});

	// `existing` was checked above, so `updated` cannot be empty — but a 0-row
	// update here would mean the record lied, so fail loud rather than return null.
	if (!updated) {
		throw error(500, "Card update matched no rows");
	}

	const responseBody = {
		card: {
			id: updated.id,
			columnId: updated.columnId,
			content: updated.content,
			priority: updated.priority,
			order: updated.order,
			dueDate: updated.dueDate,
			archived: updated.archived,
			updatedAt: updated.updatedAt,
		},
	};

	if (idempotencyKey) {
		await recordIdempotencyResult(
			auth,
			"PATCH",
			path,
			idempotencyKey,
			200,
			responseBody,
		);
	}

	return json(responseBody);
};
