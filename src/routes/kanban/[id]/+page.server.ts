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

        // Get max order
        const existingColumns = await db.query.columns.findMany({
            where: eq(columns.boardId, boardId),
        });
        const maxOrder = existingColumns.reduce((max, col) => Math.max(max, col.order), -1);

        await db.insert(columns).values({
            boardId,
            name,
            order: maxOrder + 1,
        });

        return { success: true };
    },

    createCard: async ({ request }) => {
        const data = await request.formData();
        const content = data.get("content") as string;
        const columnId = data.get("columnId") as ColumnId;

        if (!content || !columnId) return { error: "Content and Column ID are required" };

        // Get max order in column
        const existingCards = await db.query.cards.findMany({
            where: eq(cards.columnId, columnId),
        });
        const maxOrder = existingCards.reduce((max, card) => Math.max(max, card.order), -1);

        await db.insert(cards).values({
            columnId,
            content,
            order: maxOrder + 1,
        });

        return { success: true };
    },

    updateColumnOrder: async ({ request }) => {
        const data = await request.formData();
        const items = JSON.parse(data.get("items") as string);

        for (let i = 0; i < items.length; i++) {
            await db.update(columns).set({ order: i }).where(eq(columns.id, items[i].id as ColumnId));
        }

        return { success: true };
    },

    updateCardOrder: async ({ request }) => {
        const data = await request.formData();
        const items = JSON.parse(data.get("items") as string);
        const columnId = data.get("columnId") as ColumnId;

        for (let i = 0; i < items.length; i++) {
            await db.update(cards).set({ order: i, columnId }).where(eq(cards.id, items[i].id as CardId));
        }

        return { success: true };
    },

    deleteColumn: async ({ request }) => {
        const data = await request.formData();
        const columnId = data.get("columnId") as ColumnId;

        if (!columnId) return { error: "Column ID is required" };

        await db.delete(columns).where(eq(columns.id, columnId));
        return { success: true };
    },

    deleteCard: async ({ request }) => {
        const data = await request.formData();
        const cardId = data.get("cardId") as CardId;

        if (!cardId) return { error: "Card ID is required" };

        await db.delete(cards).where(eq(cards.id, cardId));
        return { success: true };
    }
};
