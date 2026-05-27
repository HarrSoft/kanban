import { error, fail } from "@sveltejs/kit";
import db from "$db";
import { boards, columns, cards, cardAssignees, cardComments, cardLabels, labels, projectMembers, users } from "$db/schema";
import { eq, asc, and, inArray } from "drizzle-orm";
import type { PageServerLoad, Actions } from "./$types";
import { BoardId, CardAssigneeId, CardCommentId, CardId, CardLabelId, ColumnId, LabelId, UserId } from "$types/ids";
import type { BoardId as BoardIdType, CardCommentId as CardCommentIdType, LabelId as LabelIdType, CardId as CardIdType, UserId as UserIdType } from "$types";
import { logCardActivity } from "$lib/server/actions/card-activity";
import { unixNow } from "$db/schema/util";

export const load: PageServerLoad = async ({ params }) => {
	const boardId = params.id as BoardId;

	const board = await db.query.boards.findFirst({
		where: eq(boards.id, boardId),
		with: {
			columns: {
				orderBy: asc(columns.order),
				with: {
					cards: {
						orderBy: asc(cards.order),
						where: eq(cards.archived, false),
						with: {
							assignees: {
								with: {
									user: {
										columns: { id: true, name: true, imageUrl: true },
									},
								},
							},
							labels: {
								with: {
									label: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!board) {
		error(404, "Board not found");
	}

	// Fetch project members for the assignee picker
	const members = await db
		.select({
			id: users.id,
			name: users.name,
			imageUrl: users.imageUrl,
		})
		.from(projectMembers)
		.innerJoin(users, eq(users.id, projectMembers.userId))
		.where(eq(projectMembers.projectId, board.projectId));

	// Fetch labels for this board
	const boardLabels = await db.select().from(labels).where(eq(labels.boardId, boardId));

	// Compute board overview stats from loaded card data
	const allCards = board.columns.flatMap(col => col.cards);
	const now = Math.floor(Date.now() / 1000);
	const oneDay = 86400;
	const boardStats = {
		totalCards: allCards.length,
		overdueCards: allCards.filter(c => c.dueDate !== null && c.dueDate < now).length,
		dueToday: allCards.filter(c => c.dueDate !== null && c.dueDate >= now && c.dueDate < now + oneDay).length,
		dueSoon: allCards.filter(c => c.dueDate !== null && c.dueDate >= now + oneDay && c.dueDate < now + 3 * oneDay).length,
		unassignedCards: allCards.filter(c => c.assignees.length === 0).length,
	};

	return { board, members, labels: boardLabels, boardStats };
};

export const actions: Actions = {
	createColumn: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get("name") as string;
		const color = (data.get("color") as string) || "#6366f1";
		const boardId = params.id as BoardId;

		if (!name) return { error: "Name is required" };

		if (name.length > 255) return { error: "Name must be 255 characters or less" };

		// Get max order
		const existingColumns = await db.query.columns.findMany({
			where: eq(columns.boardId, boardId),
		});
		const maxOrder = existingColumns.reduce(
			(max, col) => Math.max(max, col.order),
			-1,
		);

		await db.insert(columns).values({
			boardId,
			name,
			color,
			order: maxOrder + 1,
		});

		return { success: true };
	},

	createCard: async ({ request }) => {
		const data = await request.formData();
		const content = ((data.get("content") as string) || "").trim();
		const columnId = data.get("columnId") as ColumnId;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!content || !columnId)
			return { error: "Content and Column ID are required" };

		// Get max order in column
		const existingCards = await db.query.cards.findMany({
			where: eq(cards.columnId, columnId),
		});
		const maxOrder = existingCards.reduce(
			(max, card) => Math.max(max, card.order),
			-1,
		);

		const [newCard] = await db
			.insert(cards)
			.values({
				columnId,
				content,
				order: maxOrder + 1,
			})
			.returning({ id: cards.id });

		// Log card creation
		logCardActivity(newCard.id, "card_created", { userId: userId as UserId | null });

		return { success: true };
	},

	updateColumnOrder: async ({ request }) => {
		const data = await request.formData();
		const raw = data.get("items") as string;

		let items: { id: string }[];
		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) throw new Error();
			// Reject if any item lacks an id
			for (const item of parsed) {
				if (!item || typeof item !== "object" || typeof item.id !== "string") {
					return { error: "Each item must have a string 'id' field" };
				}
			}
			items = parsed;
		} catch {
			return { error: "Invalid items payload — expected a JSON array" };
		}

		// Batch update: map id → order, then update in parallel
		await Promise.all(
			items.map((item, i) =>
				db
					.update(columns)
					.set({ order: i })
					.where(eq(columns.id, item.id as ColumnId)),
			),
		);

		return { success: true };
	},

	updateCardOrder: async ({ request }) => {
		const data = await request.formData();
		const raw = data.get("items") as string;
		const columnId = data.get("columnId") as ColumnId;
		const userId = (data.get("userId") as UserId | null) ?? null;

		let items: { id: string; prevColumnId?: string }[];
		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) throw new Error();
			for (const item of parsed) {
				if (!item || typeof item !== "object" || typeof item.id !== "string") {
					return { error: "Each item must have a string 'id' field" };
				}
			}
			items = parsed;
		} catch {
			return { error: "Invalid items payload — expected a JSON array" };
		}

		if (!columnId) return { error: "Column ID is required" };

		// Batch update: map id → order, update in parallel
		await Promise.all(
			items.map((item, i) =>
				db
					.update(cards)
					.set({ order: i, columnId })
					.where(eq(cards.id, item.id as CardId)),
			),
		);

		// Log card moves for cards that changed columns (cross-column drag)
		const movedCards = items.filter(item => item.prevColumnId && item.prevColumnId !== columnId);
		for (const moved of movedCards) {
			logCardActivity(moved.id as CardId, "card_moved", {
				userId: userId as UserId | null,
				metadata: { fromColumnId: moved.prevColumnId, toColumnId: columnId },
			});
		}

		return { success: true };
	},

	updateColumnColor: async ({ request }) => {
		const data = await request.formData();
		const columnId = data.get("columnId") as ColumnId;
		const color = data.get("color") as string;

		if (!columnId) return { error: "Column ID is required" };
		if (!color) return { error: "Color is required" };

		await db.update(columns).set({ color }).where(eq(columns.id, columnId));
		return { success: true };
	},

	updateColumn: async ({ request }) => {
		const data = await request.formData();
		const columnId = data.get("columnId") as ColumnId;
		const name = (data.get("name") as string || "").trim();

		if (!columnId) return { error: "Column ID is required" };
		if (!name) return { error: "Column name cannot be empty" };

		await db.update(columns).set({ name }).where(eq(columns.id, columnId));
		return { success: true };
	},

	deleteColumn: async ({ request }) => {
		const data = await request.formData();
		const columnId = data.get("columnId") as ColumnId;

		if (!columnId) return { error: "Column ID is required" };

		// DB cascade handles card deletion; just delete the column
		await db.delete(columns).where(eq(columns.id, columnId));
		return { success: true };
	},

	deleteCard: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId) return { error: "Card ID is required" };

		await db.delete(cards).where(eq(cards.id, cardId));

		// Can't log after delete since card is gone — log before
		// (actually we already deleted it, but card_activity cascades too)
		// Log with the card id before cascade deletes our entry
		try {
			logCardActivity(cardId, "card_deleted", { userId: userId as UserId | null });
		} catch {
			// Activity log entry may fail if cascade already removed it — that's fine
		}

		return { success: true };
	},

	updateCardDescription: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const description = (data.get("description") as string | null) ?? null;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId) return { error: "Card ID is required" };

		await db.update(cards).set({ description }).where(eq(cards.id, cardId));

		logCardActivity(cardId, "card_description_updated", { userId: userId as UserId | null });

		return { success: true };
	},

	deleteBoard: async ({ params }) => {
		const boardId = params.id as BoardId;

		// DB cascades handle columns and cards deletion
		await db.delete(boards).where(eq(boards.id, boardId));

		return { success: true, deleted: true };
	},

	updateCard: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const content = (data.get("content") as string || "").trim();
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId) return { error: "Card ID is required" };
		if (!content) return { error: "Content cannot be empty" };

		await db.update(cards).set({ content }).where(eq(cards.id, cardId));

		logCardActivity(cardId, "card_content_updated", { userId: userId as UserId | null });

		return { success: true };
	},

	updateBoard: async ({ request, params }) => {
		const data = await request.formData();
		const boardId = params.id as BoardId;
		const name = (data.get("name") as string || "").trim();
		const description = (data.get("description") as string || "").trim();

		if (!boardId) return { error: "Board ID is required" };

		const updateData: Record<string, string | null> = {};
		if (name) updateData.name = name;
		if (description !== undefined) updateData.description = description || null;

		if (Object.keys(updateData).length === 0) return { error: "Nothing to update" };

		await db.update(boards).set(updateData).where(eq(boards.id, boardId));
		return { success: true };
	},

	setDueDate: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const dueDateRaw = data.get("dueDate") as string | null;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId) {
			return fail(400, { error: "Card ID is required" });
		}

		// Parse date: empty string or null means clear the due date
		const dueDate: number | null =
			dueDateRaw && dueDateRaw.trim() !== ""
				? Math.floor(new Date(dueDateRaw).getTime() / 1000)
				: null;

		await db.update(cards).set({ dueDate }).where(eq(cards.id, cardId));

		logCardActivity(cardId, dueDate === null ? "card_due_date_cleared" : "card_due_date_set", {
			userId: userId as UserId | null,
			metadata: { dueDate },
		});

		return { success: true };
	},

	archiveCard: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId) return { error: "Card ID is required" };

		await db.update(cards).set({ archived: true }).where(eq(cards.id, cardId));

		logCardActivity(cardId, "card_archived", { userId: userId as UserId | null });

		return { success: true };
	},

	assignUser: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const userId = data.get("userId") as UserId;
		const actorUserId = (data.get("actorUserId") as UserId | null) ?? null;

		if (!cardId || !userId) {
			return fail(400, { error: "Card ID and User ID are required" });
		}

		// Check if already assigned
		const existing = await db.query.cardAssignees.findFirst({
			where: and(
				eq(cardAssignees.cardId, cardId),
				eq(cardAssignees.userId, userId),
			),
		});

		if (!existing) {
			await db.insert(cardAssignees).values({ cardId, userId });

			logCardActivity(cardId, "card_assignee_added", {
				userId: actorUserId as UserId | null,
				metadata: { assignedUserId: userId },
			});
		}

		return { success: true };
	},

	unassignUser: async ({ request }) => {
		const data = await request.formData();
		const assigneeId = data.get("assigneeId") as CardAssigneeId;
		const cardId = data.get("cardId") as CardId | null;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!assigneeId) {
			return fail(400, { error: "Assignee ID is required" });
		}

		// Fetch the assignment to get the userId for the activity log
		let removedUserId: string | null = null;
		if (!cardId) {
			const assignee = await db.query.cardAssignees.findFirst({
				where: eq(cardAssignees.id, assigneeId),
				columns: { cardId: true, userId: true },
			});
			if (assignee) {
				removedUserId = assignee.userId;
			}
		}
		const resolvedCardId = cardId || (await db.query.cardAssignees.findFirst({
			where: eq(cardAssignees.id, assigneeId),
			columns: { cardId: true },
		}))?.cardId;

		await db
			.delete(cardAssignees)
			.where(eq(cardAssignees.id, assigneeId));

		logCardActivity(resolvedCardId as CardId, "card_assignee_removed", {
			userId: userId as UserId | null,
			metadata: { removedAssigneeId: assigneeId },
		});

		return { success: true };
	},

	unarchiveCard: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId) return { error: "Card ID is required" };

		await db.update(cards).set({ archived: false }).where(eq(cards.id, cardId));

		logCardActivity(cardId, "card_unarchived", { userId: userId as UserId | null });

		return { success: true };
	},

	createLabel: async ({ request, params }) => {
		const data = await request.formData();
		const name = (data.get("name") as string || "").trim();
		const color = (data.get("color") as string || "#6366f1").trim();
		const boardId = params.id as BoardId;

		if (!name) return { error: "Label name is required" };

		await db.insert(labels).values({ boardId, name, color });
		return { success: true };
	},

	deleteLabel: async ({ request }) => {
		const data = await request.formData();
		const labelId = data.get("labelId") as LabelId;

		if (!labelId) return { error: "Label ID is required" };

		await db.delete(labels).where(eq(labels.id, labelId));
		return { success: true };
	},

	assignLabel: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const labelId = data.get("labelId") as LabelId;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId || !labelId) return { error: "Card ID and Label ID are required" };

		// Check if already assigned
		const existing = await db.query.cardLabels.findFirst({
			where: and(
				eq(cardLabels.cardId, cardId),
				eq(cardLabels.labelId, labelId),
			),
		});

		if (!existing) {
			await db.insert(cardLabels).values({ cardId, labelId });

			logCardActivity(cardId, "card_label_added", {
				userId: userId as UserId | null,
				metadata: { labelId },
			});
		}

		return { success: true };
	},

	removeLabel: async ({ request }) => {
		const data = await request.formData();
		const cardLabelId = data.get("cardLabelId") as CardLabelId;
		const cardId = data.get("cardId") as CardId | null;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardLabelId) return { error: "Card label assignment ID is required" };

		// Resolve cardId if not provided
		let resolvedCardId = cardId;
		if (!resolvedCardId) {
			const cl = await db.query.cardLabels.findFirst({
				where: eq(cardLabels.id, cardLabelId),
				columns: { cardId: true },
			});
			resolvedCardId = cl?.cardId ?? null;
		}

		await db.delete(cardLabels).where(eq(cardLabels.id, cardLabelId));

		if (resolvedCardId) {
			logCardActivity(resolvedCardId as CardId, "card_label_removed", {
				userId: userId as UserId | null,
				metadata: { cardLabelId },
			});
		}

		return { success: true };
	},

	getArchivedCards: async ({ params }) => {
		const boardId = params.id as BoardId;

		// Get column IDs for this board
		const boardColumns = await db.query.columns.findMany({
			where: eq(columns.boardId, boardId),
			columns: { id: true },
		});
		const columnIds = boardColumns.map(c => c.id);

		if (columnIds.length === 0) {
			return { archivedCards: [] };
		}

		const archivedCards = await db.query.cards.findMany({
			where: and(
				eq(cards.archived, true),
				inArray(cards.columnId, columnIds),
			),
			orderBy: asc(cards.order),
			with: {
				column: {
					columns: { name: true },
				},
			},
		});

		return { archivedCards };
	},

	duplicateCard: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const userId = (data.get("userId") as UserId | null) ?? null;

		if (!cardId) return { error: "Card ID is required" };

		// Fetch the original card
		const original = await db.query.cards.findFirst({
			where: eq(cards.id, cardId),
			with: {
				labels: true,
				assignees: true,
			},
		});

		if (!original) return { error: "Card not found" };

		// Get max order in the same column
		const existingCards = await db.query.cards.findMany({
			where: eq(cards.columnId, original.columnId),
		});
		const maxOrder = existingCards.reduce(
			(max, c) => Math.max(max, c.order),
			-1,
		);

		// Insert the duplicate card
		const [newCard] = await db
			.insert(cards)
			.values({
				columnId: original.columnId,
				content: original.content,
				order: maxOrder + 1,
				dueDate: original.dueDate,
			})
			.returning({ id: cards.id });

		// Copy labels
		if (original.labels && original.labels.length > 0) {
			await db.insert(cardLabels).values(
				original.labels.map((cl) => ({
					cardId: newCard.id,
					labelId: cl.labelId,
				})),
			);
		}

		// Copy assignees
		if (original.assignees && original.assignees.length > 0) {
			await db.insert(cardAssignees).values(
				original.assignees.map((a) => ({
					cardId: newCard.id,
					userId: a.userId,
				})),
			);
		}

		// Log both the source card's duplicate action and the new card's creation
		logCardActivity(cardId, "card_created", {
			userId: userId as UserId | null,
			metadata: { duplicatedTo: newCard.id },
		});
		logCardActivity(newCard.id, "card_created", {
			userId: userId as UserId | null,
			metadata: { duplicatedFrom: cardId },
		});

		return { success: true };
	},

	addComment: async ({ request }) => {
		const data = await request.formData();
		const cardId = data.get("cardId") as CardId;
		const content = data.get("content") as string;
		const userId = (data.get("userId") as string | null) ?? null;

		if (!cardId || !content?.trim()) {
			return { error: "Card ID and content are required" };
		}

		// Verify card exists
		const card = await db.query.cards.findFirst({
			where: eq(cards.id, cardId),
		});
		if (!card) return { error: "Card not found" };

		const [newComment] = await db
			.insert(cardComments)
			.values({
				cardId,
				authorId: userId as UserId,
				content: content.trim(),
			})
			.returning();

		await logCardActivity(cardId, "card_comment_added", {
			userId: userId as UserId | null,
			metadata: { commentId: newComment.id },
		});

		return { success: true, comment: newComment };
	},

	editComment: async ({ request }) => {
		const data = await request.formData();
		const commentId = data.get("commentId") as CardCommentId;
		const content = data.get("content") as string;
		const userId = (data.get("userId") as string | null) ?? null;

		if (!commentId || !content?.trim()) {
			return { error: "Comment ID and content are required" };
		}

		// Verify comment exists and check ownership
		const comment = await db.query.cardComments.findFirst({
			where: eq(cardComments.id, commentId as unknown as CardCommentIdType),
		});

		if (!comment) return { error: "Comment not found" };

		if (userId && comment.authorId !== userId) {
			return { error: "Only the comment author may edit this comment" };
		}

		const [updated] = await db
			.update(cardComments)
			.set({ content: content.trim() })
			.where(eq(cardComments.id, commentId as unknown as CardCommentIdType))
			.returning();

		await logCardActivity(comment.cardId, "card_comment_edited", {
			userId: userId as UserId | null,
			metadata: { commentId: updated.id },
		});

		return { success: true, comment: updated };
	},

	deleteComment: async ({ request }) => {
		const data = await request.formData();
		const commentId = data.get("commentId") as CardCommentId;
		const userId = (data.get("userId") as string | null) ?? null;

		if (!commentId) {
			return { error: "Comment ID is required" };
		}

		const comment = await db.query.cardComments.findFirst({
			where: eq(cardComments.id, commentId as unknown as CardCommentIdType),
		});

		if (!comment) return { error: "Comment not found" };

		if (userId && comment.authorId !== userId) {
			return { error: "Only the comment author may delete this comment" };
		}

		await db
			.delete(cardComments)
			.where(eq(cardComments.id, commentId as unknown as CardCommentIdType));

		await logCardActivity(comment.cardId, "card_comment_deleted", {
			userId: userId as UserId | null,
		});

		return { success: true };
	},
};
