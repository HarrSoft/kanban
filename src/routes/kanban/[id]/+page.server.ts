import { error } from "@sveltejs/kit";
import db from "$db";
import { boards, columns, cards } from "$db/schema";
import { eq, asc } from "drizzle-orm";
import type { PageServerLoad, Actions } from "./$types";
import { BoardId, ColumnId, CardId } from "$types/ids";

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
					},
				},
			},
		},
	});

	if (!board) {
		error(404, "Board not found");
	}

	return { board };
};

export const actions: Actions = {
	createColumn: async ({ request, params }) => {
		const data = await request.formData();
		const name = data.get("name") as string;
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
			order: maxOrder + 1,
		});

		return { success: true };
	},

	createCard: async ({ request }) => {
		const data = await request.formData();
		const content = ((data.get("content") as string) || "").trim();
		const columnId = data.get("columnId") as ColumnId;

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

		await db.insert(cards).values({
			columnId,
			content,
			order: maxOrder + 1,
		});

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

		let items: { id: string }[];
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

		if (!cardId) return { error: "Card ID is required" };

		await db.delete(cards).where(eq(cards.id, cardId));
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

		if (!cardId) return { error: "Card ID is required" };
		if (!content) return { error: "Content cannot be empty" };

		await db.update(cards).set({ content }).where(eq(cards.id, cardId));
		return { success: true };
	},

	updateBoard: async ({ request, params }) => {
		const data = await request.formData();
		const boardId = params.id as BoardId;
		const name = (data.get("name") as string || "").trim();
		const description = (data.get("description") as string || "").trim();

		if (!boardId) return { error: "Board ID is required" };

		const updateData: Record<string, string> = {};
		if (name) updateData.name = name;
		if (description !== undefined) updateData.description = description || null;

		if (Object.keys(updateData).length === 0) return { error: "Nothing to update" };

		await db.update(boards).set(updateData).where(eq(boards.id, boardId));
		return { success: true };
	},
};
