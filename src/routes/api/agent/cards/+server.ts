import { json, error } from "@sveltejs/kit";
import { eq, and, asc, sql } from "drizzle-orm";
import db, { boards, columns, cards } from "$db";
import { authenticateAgent } from "../auth";
import {
	getIdempotencyResponse,
	recordIdempotencyResult,
	sendIdempotencyResponse,
} from "../idempotency";
import type { RequestHandler } from "../$types";

/**
 * POST /api/agent/cards — create a new card in the agent's project.
 *
 * Idempotent: supports Idempotency-Key header for safe retries.
 *
 * Request body (JSON):
 *   boardId   — string (required) — which board to create the card in
 *   columnId  — string (optional) — which column; omitted => first column of board
 *   content   — string (required) — card content/body
 *   order     — number (optional) — position; default appends to end
 *
 * Returns the created card: { id, columnId, content, order, dueDate, archived, createdAt }
 */
export const POST: RequestHandler = async (event) => {
	const auth = await authenticateAgent(event);

	// Idempotency check
	const idempotencyKey = event.request.headers.get("Idempotency-Key");
	const cached = await getIdempotencyResponse(
		auth,
		"POST",
		"/api/agent/cards",
		idempotencyKey,
	);
	if (cached) {
		return sendIdempotencyResponse(cached);
	}

	const body = await event.request.json().catch(() => ({}));
	const boardId: string | undefined = body.boardId;
	const rawContent: string | undefined = body.content;
	const columnId: string | undefined = body.columnId;
	const order: number | undefined = body.order;

	if (!boardId) {
		throw error(400, "boardId is required");
	}
	if (!rawContent) {
		throw error(400, "content is required");
	}

	// Validate content length (copying the constraint from CardContent)
	const trimmed = rawContent.trim();
	if (trimmed.length > 500) {
		throw error(400, "content exceeds 500 characters");
	}

	// Verify board belongs to agent's project and is not archived
	const [board] = await db
		.select({ id: boards.id })
		.from(boards)
		.where(
			and(
				eq(boards.id, boardId as any),
				eq(boards.projectId, auth.projectId as any),
				eq(boards.archived, false),
			),
		)
		.limit(1);

	if (!board) {
		throw error(404, "Board not found or not accessible");
	}

	// Resolve column
	let targetColumnId = columnId;
	if (!targetColumnId) {
		const [firstColumn] = await db
			.select({ id: columns.id })
			.from(columns)
			.where(eq(columns.boardId, board.id as any))
			.orderBy(asc(columns.order), asc(columns.name))
			.limit(1);

		if (!firstColumn) {
			throw error(400, "Board has no columns; create a column first");
		}
		targetColumnId = firstColumn.id;
	}

	// Determine card order (append to end if not specified)
	let cardOrder = order;
	if (cardOrder === undefined) {
		const [result] = await db
			.select({ maxOrder: sql<number>`max(${cards.order})` })
			.from(cards)
			.where(eq(cards.columnId, targetColumnId as any));

		cardOrder = (result?.maxOrder ?? -1) + 1;
	}

	const [card] = await db
		.insert(cards)
		.values({
			columnId: targetColumnId as any,
			content: trimmed,
			order: cardOrder,
		})
		.returning({
			id: cards.id,
			columnId: cards.columnId,
			content: cards.content,
			order: cards.order,
			dueDate: cards.dueDate,
			archived: cards.archived,
			createdAt: cards.createdAt,
		});

	const responseBody = {
		card: {
			id: card.id,
			columnId: card.columnId,
			content: card.content,
			order: card.order,
			dueDate: card.dueDate,
			archived: card.archived,
			createdAt: card.createdAt,
		},
	};

	// Record idempotent response
	if (idempotencyKey) {
		await recordIdempotencyResult(
			auth,
			"POST",
			"/api/agent/cards",
			idempotencyKey,
			201,
			responseBody,
		);
	}

	return json(responseBody, { status: 201 });
};
