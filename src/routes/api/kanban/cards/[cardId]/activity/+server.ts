import { json } from "@sveltejs/kit";
import db from "$db";
import { cardActivity, users } from "$db/schema";
import { eq, desc } from "drizzle-orm";
import * as v from "valibot";
import type { RequestHandler } from "./$types";
import { CardId } from "$types/ids";

/**
 * GET /api/kanban/cards/[cardId]/activity
 * Returns the last 50 activity entries for a card, with user info.
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const cardId = v.parse(CardId, params.cardId);

		const activities = await db
			.select({
				id: cardActivity.id,
				cardId: cardActivity.cardId,
				userId: cardActivity.userId,
				activityType: cardActivity.activityType,
				metadata: cardActivity.metadata,
				actedAt: cardActivity.actedAt,
				userName: users.name,
				userImageUrl: users.imageUrl,
			})
			.from(cardActivity)
			.leftJoin(users, eq(users.id, cardActivity.userId))
			.where(eq(cardActivity.cardId, cardId))
			.orderBy(desc(cardActivity.actedAt))
			.limit(50);

		return json(activities);
	} catch (e) {
		console.error("[Activity API] Error fetching card activity:", e);
		return json({ error: "Failed to fetch activity" }, { status: 500 });
	}
};
