import { json } from "@sveltejs/kit";
import db from "$db";
import { cardComments } from "$db/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { CardId, CardCommentId } from "$types/ids";
import type { RequestHandler } from "./$types";
import type { CardId as CardIdType, CardCommentId as CardCommentIdType } from "$types";

/**
 * PATCH /api/kanban/cards/[cardId]/comments/[commentId]
 * Updates a comment's content. Only the author may edit.
 * Body: { content: string, userId?: string }
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const rawCardId = params.cardId;
	const rawCommentId = params.commentId;

	if (!rawCardId || !rawCommentId) {
		return json({ error: "Missing cardId or commentId" }, { status: 400 });
	}

	let cardId: CardIdType;
	let commentId: CardCommentIdType;
	try {
		cardId = v.parse(CardId, rawCardId);
		commentId = v.parse(CardCommentId, rawCommentId);
	} catch {
		return json({ error: "Invalid ID format" }, { status: 400 });
	}

	const body: { content?: string; userId?: string } = await request.json();

	if (!body.content?.trim()) {
		return json({ error: "Content is required" }, { status: 400 });
	}

	// Fetch the comment to verify it exists
	const comment = await db.query.cardComments.findFirst({
		where: eq(cardComments.id, commentId),
	});

	if (!comment) {
		return json({ error: "Comment not found" }, { status: 404 });
	}

	// Only author or anonymous (no userId) edits allowed — anonymous edits only if comment has no author
	if (body.userId && comment.authorId !== body.userId) {
		return json({ error: "Only the comment author may edit this comment" }, { status: 403 });
	}

	const [updated] = await db
		.update(cardComments)
		.set({ content: body.content.trim() })
		.where(eq(cardComments.id, commentId))
		.returning();

	return json(updated);
};

/**
 * DELETE /api/kanban/cards/[cardId]/comments/[commentId]
 * Deletes a comment. Only the author may delete.
 * Query: ?userId=<id>
 */
export const DELETE: RequestHandler = async ({ params, url }) => {
	const rawCardId = params.cardId;
	const rawCommentId = params.commentId;

	if (!rawCardId || !rawCommentId) {
		return json({ error: "Missing cardId or commentId" }, { status: 400 });
	}

	let cardId: CardIdType;
	let commentId: CardCommentIdType;
	try {
		cardId = v.parse(CardId, rawCardId);
		commentId = v.parse(CardCommentId, rawCommentId);
	} catch {
		return json({ error: "Invalid ID format" }, { status: 400 });
	}

	const userId = url.searchParams.get("userId");

	// Fetch the comment to verify it exists and check ownership
	const comment = await db.query.cardComments.findFirst({
		where: eq(cardComments.id, commentId),
	});

	if (!comment) {
		return json({ error: "Comment not found" }, { status: 404 });
	}

	// Only author or anonymous (no userId) deletes allowed
	if (userId && comment.authorId !== userId) {
		return json({ error: "Only the comment author may delete this comment" }, { status: 403 });
	}

	await db.delete(cardComments).where(eq(cardComments.id, commentId));

	return json({ success: true });
};
