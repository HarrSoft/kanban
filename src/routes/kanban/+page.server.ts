import db from "$db";
import { boards, projects, columns, cards, cardAssignees, cardLabels, labels } from "$db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { BoardId, ColumnId, ProjectId, CardId } from "$types/ids";
import type { PageServerLoad, Actions } from "./$types";
import { cuid2 } from "$server/crypto";

export const load: PageServerLoad = async () => {
	// Fetch active boards with column & card counts, plus last activity time
	const activeBoards = await db
		.select({
			id: boards.id,
			name: boards.name,
			description: boards.description,
			projectId: boards.projectId,
			archived: boards.archived,
			createdAt: boards.createdAt,
			columnCount: sql<number>`count(distinct ${columns.id})`,
			cardCount: sql<number>`count(distinct ${cards.id})`,
			lastActivity: sql<number | null>`greatest(
				${boards.updatedAt},
				coalesce(max(${columns.updatedAt}), 0),
				coalesce(max(${cards.updatedAt}), 0)
			)`,
		})
		.from(boards)
		.leftJoin(columns, eq(columns.boardId, boards.id))
		.leftJoin(cards, eq(cards.columnId, columns.id))
		.where(eq(boards.archived, false))
		.groupBy(boards.id, boards.name, boards.description, boards.projectId, boards.archived, boards.createdAt, boards.updatedAt);

	// Fetch archived boards separately
	const archivedBoards = await db
		.select({
			id: boards.id,
			name: boards.name,
			description: boards.description,
			projectId: boards.projectId,
			archived: boards.archived,
			createdAt: boards.createdAt,
			columnCount: sql<number>`count(distinct ${columns.id})`,
			cardCount: sql<number>`count(distinct ${cards.id})`,
			lastActivity: sql<number | null>`greatest(
				${boards.updatedAt},
				coalesce(max(${columns.updatedAt}), 0),
				coalesce(max(${cards.updatedAt}), 0)
			)`,
		})
		.from(boards)
		.leftJoin(columns, eq(columns.boardId, boards.id))
		.leftJoin(cards, eq(cards.columnId, columns.id))
		.where(eq(boards.archived, true))
		.groupBy(boards.id, boards.name, boards.description, boards.projectId, boards.archived, boards.createdAt, boards.updatedAt);

	const allProjects = await db.select().from(projects);

	return { boards: activeBoards, archivedBoards, projects: allProjects };
};

export const actions: Actions = {
	createBoard: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get("name") as string || "").trim();
		const projectId = data.get("projectId") as ProjectId;
		const description = (data.get("description") as string || "").trim();

		if (!name) return { error: "Board name is required" };
		if (!projectId) return { error: "Project is required" };

		await db.insert(boards).values({
			name,
			projectId,
			description: description || null,
		});

		return { success: true };
	},

	archiveBoard: async ({ request }) => {
		const data = await request.formData();
		const boardId = data.get("boardId") as BoardId;

		if (!boardId) return { error: "Board ID is required" };

		await db.update(boards)
			.set({ archived: true })
			.where(eq(boards.id, boardId));

		return { success: true };
	},

	unarchiveBoard: async ({ request }) => {
		const data = await request.formData();
		const boardId = data.get("boardId") as BoardId;

		if (!boardId) return { error: "Board ID is required" };

		await db.update(boards)
			.set({ archived: false })
			.where(eq(boards.id, boardId));

		return { success: true };
	},

	duplicateBoard: async ({ request }) => {
		const data = await request.formData();
		const boardId = data.get("boardId") as BoardId;
		const includeCards = data.get("includeCards") === "true";

		if (!boardId) return { error: "Board ID is required" };

		// Fetch the source board
		const [sourceBoard] = await db
			.select()
			.from(boards)
			.where(eq(boards.id, boardId))
			.limit(1);

		if (!sourceBoard) return { error: "Board not found" };

		// Create the new board
		const newBoardId = cuid2() as BoardId;
		const now = Math.floor(Date.now() / 1000);

		await db.insert(boards).values({
			id: newBoardId,
			name: `${sourceBoard.name} (copy)`,
			description: sourceBoard.description,
			projectId: sourceBoard.projectId,
			archived: false,
			createdAt: now,
			updatedAt: now,
		});

		// Fetch source columns
		const sourceColumns = await db
			.select()
			.from(columns)
			.where(eq(columns.boardId, boardId))
			.orderBy(columns.order);

		// Map of old column ID -> new column ID for card reassignment
		const columnIdMap = new Map<string, string>();

		// Create new columns
		for (const col of sourceColumns) {
			const newColumnId = cuid2() as ColumnId;
			columnIdMap.set(col.id, newColumnId);

			await db.insert(columns).values({
				id: newColumnId,
				boardId: newBoardId,
				name: col.name,
				order: col.order,
				color: col.color,
				createdAt: now,
				updatedAt: now,
			});
		}

		// Optionally copy cards
		if (includeCards && columnIdMap.size > 0) {
			const sourceCards = await db
				.select()
				.from(cards)
				.where(inArray(cards.columnId, sourceColumns.map(c => c.id)))
				.orderBy(cards.order);

			for (const card of sourceCards) {
				const newColumnId = columnIdMap.get(card.columnId);
				if (!newColumnId) continue;

				const newCardId = cuid2() as CardId;

				await db.insert(cards).values({
					id: newCardId,
					columnId: newColumnId,
					content: card.content,
					description: card.description,
					order: card.order,
					archived: card.archived,
					createdAt: now,
					updatedAt: now,
				});
			}
		}

		return { success: true, newBoardId };
	},

	deleteBoard: async ({ request }) => {
		const data = await request.formData();
		const boardId = data.get("boardId") as BoardId;

		if (!boardId) return { error: "Board ID is required" };

		// Delete all cards in the board's columns, then columns, then the board
		const boardColumns = await db
			.select({ id: columns.id })
			.from(columns)
			.where(eq(columns.boardId, boardId));

		const columnIds = boardColumns.map(c => c.id);

		if (columnIds.length > 0) {
			await db.delete(cards).where(inArray(cards.columnId, columnIds));
			await db.delete(columns).where(eq(columns.boardId, boardId));
		}

		await db.delete(boards).where(eq(boards.id, boardId));

		return { success: true };
	},
};
