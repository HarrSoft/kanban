import * as t from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { cards } from "./kanban";
import { users } from "./users";
import { id, timestamps, unix } from "./util";
import { CardActivityId, CardId, UserId } from "$types/ids"; // drizzle-kit can't handle path aliases
import type { CardId as CardIdType, UserId as UserIdType } from "$types";

/**
 * Activity types for card-level actions.
 * Each describes the change made to a card.
 */
export const cardActivityType = t.pgEnum("card_activity_type", [
	"card_created",
	"card_content_updated",
	"card_moved",
	"card_archived",
	"card_unarchived",
	"card_deleted",
	"card_due_date_set",
	"card_due_date_cleared",
	"card_assignee_added",
	"card_assignee_removed",
	"card_label_added",
	"card_label_removed",
]);

export const cardActivity = t.pgTable("card_activity", {
	id: id().primaryKey().$type<CardActivityId>(),
	cardId: t
		.text("card_id")
		.notNull()
		.references(() => cards.id, { onDelete: "cascade" })
		.$type<CardId>(),
	userId: t
		.text("user_id")
		.$type<UserId>(),
	activityType: cardActivityType("activity_type").notNull(),
	metadata: t
		.jsonb("metadata")
		.$type<Record<string, unknown>>()
		.default({}),
	actedAt: unix("acted_at").notNull(),
	...timestamps,
});

export const cardActivityRelations = relations(cardActivity, ({ one }) => ({
	card: one(cards, {
		fields: [cardActivity.cardId],
		references: [cards.id],
	}),
	user: one(users, {
		fields: [cardActivity.userId],
		references: [users.id],
	}),
}));
