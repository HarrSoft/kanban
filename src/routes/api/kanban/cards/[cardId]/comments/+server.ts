import { json } from "@sveltejs/kit";
import db from "$db";
import { cardComments, users } from "$db/schema";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";
import { CardId } from "$types/ids";
import type { RequestHandler } from "./$types";
import type { CardId as CardIdType } from "$types";

/**
 * GET /api/kanban/cards/[cardId]/comments
 * Returns all comments for a card, ordered by creation time ascending.
 */
export const GET: RequestHandler = async ({ params }) => {
	const rawCardId = params.cardId;

	if (!rawCardId) {
		return json({ error: "Missing cardId" }, { status: 400 });
	}

	let cardId: CardIdType;
	try {
		cardId = v.parse(CardId, rawCardId);
	} catch {
		return json({ error: "Invalid cardId format" }, { status: 400 });
	}

	const comments = await db
		.select({
			id: cardComments.id,
			cardId: cardComments.cardId,
			content: cardComments.content,
			createdAt: cardComments.createdAt,
			author: {
				id: users.id,
				name: users.name,
				avatar: users.avatar,
			},
		})
		.from(cardComments)
		.where(eq(cardComments.cardId, cardId))
		.leftJoin(users, eq(cardComments.authorId, users.id))
		.orderBy(asc(cardComments.createdAt));

	return json(comments);
};
