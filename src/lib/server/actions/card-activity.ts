import db from "$db";
import { cardActivity } from "$db/schema";
import type { CardId, UserId } from "$types";
import { unixNow } from "$db/schema/util";

/**
 * Activity types that can be logged for a card.
 */
export type CardActivityType =
	| "card_created"
	| "card_content_updated"
	| "card_moved"
	| "card_archived"
	| "card_unarchived"
	| "card_deleted"
	| "card_due_date_set"
	| "card_due_date_cleared"
	| "card_assignee_added"
	| "card_assignee_removed"
	| "card_label_added"
	| "card_label_removed";

/**
 * Log an activity entry for a card.
 */
export async function logCardActivity(
	cardId: CardId,
	activityType: CardActivityType,
	options?: {
		userId?: UserId | null;
		metadata?: Record<string, unknown>;
		actedAt?: number;
	},
): Promise<void> {
	await db.insert(cardActivity).values({
		cardId,
		userId: options?.userId ?? null,
		activityType,
		metadata: options?.metadata ?? {},
		actedAt: options?.actedAt ?? unixNow(),
	});
}
