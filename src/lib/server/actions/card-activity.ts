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
	try {
		await db.insert(cardActivity).values({
			cardId,
			userId: options?.userId ?? null,
			activityType,
			metadata: options?.metadata ?? {},
			actedAt: options?.actedAt ?? unixNow(),
		});
	} catch (err) {
		// Activity logging is best-effort. A missing card id (FK violation on
		// card_activity.card_id) or any transient DB error must never reject into
		// an unhandled promise and take down the process — most callers fire this
		// without awaiting. Fail loudly in the log, but let the caller's real
		// result stand.
		console.error(
			`[card-activity] failed to log "${activityType}" for card ${cardId}:`,
			err,
		);
	}
}
