import { json } from "@sveltejs/kit";
import db from "$db";
import { boards, columns as columnsSchema, projects, cards } from "$db/schema";
import { eq, sql } from "drizzle-orm";
import * as v from "valibot";
import { ProjectId, BoardId, ColumnId } from "$types/ids";
import type { RequestHandler } from "./$types";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

const CardItemSchema = v.object({
	title: v.pipe(v.string(), v.minLength(1, "card title cannot be empty")),
	description: v.optional(v.string(), ""),
	column: v.optional(v.string(), ""), // column name to place card in; empty = first column
});

const CreateBoardSchema = v.object({
	projectId: v.optional(v.string(), ""),
	name: v.pipe(v.string("name is required"), v.minLength(1, "name cannot be empty")),
	description: v.optional(v.string(), ""),
	columns: v.optional(v.array(v.string()), DEFAULT_COLUMNS),
	/** Array of card titles to create in the first column */
	cardTitles: v.optional(v.array(v.string()), []),
	/** Rich card payloads with title, description, and optional column placement */
	cards: v.optional(v.array(CardItemSchema), []),
});

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.json();

	const parsed = v.safeParse(CreateBoardSchema, raw);
	if (!parsed.success) {
		const issues = parsed.issues.map(i => i.message).join("; ");
		return json({ error: issues }, { status: 400 });
	}

	const { name, description, columns: columnNames, cardTitles, cards: rawCards, projectId } = parsed.output;

	// Determine project: use provided one, or fall back to first project
	let resolvedProjectId = projectId;
	if (!resolvedProjectId) {
		const allProjects = await db.select({ id: projects.id }).from(projects);
		if (allProjects.length === 0) {
			return json({ error: "No projects exist. Create a project first." }, { status: 400 });
		}
		resolvedProjectId = allProjects[0].id;
	}

	// Validate projectId format if provided
	let finalProjectId: string;
	try {
		finalProjectId = resolvedProjectId ? v.parse(ProjectId, resolvedProjectId) : "";
	} catch {
		return json({ error: "Invalid projectId format" }, { status: 400 });
	}

	// Create the board
	const [board] = await db
		.insert(boards)
		.values({
			name,
			projectId: finalProjectId,
			description: description || null,
		})
		.returning();

	// Create default columns
	const createdColumns = [];
	for (let i = 0; i < columnNames.length; i++) {
		const [col] = await db
			.insert(columnsSchema)
			.values({
				boardId: board.id as BoardId,
				name: columnNames[i],
				order: i,
			})
			.returning();
		createdColumns.push(col);
	}

	// Build column name → column lookup
	const columnByName = new Map(createdColumns.map((c) => [c.name, c]));

	// Create cards from both cardTitles (legacy) and cards (rich payload)
	const createdCards = [];

	// Handle legacy cardTitles — put in first column
	if (cardTitles.length > 0 && createdColumns.length > 0) {
		const firstColumn = createdColumns[0];
		for (let i = 0; i < cardTitles.length; i++) {
			const [card] = await db
				.insert(cards)
				.values({
					columnId: firstColumn.id,
					content: cardTitles[i],
					order: i,
				})
				.returning();
			createdCards.push(card);
		}
	}

	// Handle rich card payloads — place in specified column or fall back to first
	if (rawCards.length > 0) {
		// Group cards by column name
		const cardsByColumn = new Map<string, typeof rawCards>();
		for (const card of rawCards) {
			const colName = card.column || columnNames[0];
			if (!cardsByColumn.has(colName)) cardsByColumn.set(colName, []);
			cardsByColumn.get(colName)!.push(card);
		}

		for (const [colName, colCards] of cardsByColumn) {
			const targetColumn = columnByName.get(colName);
			if (!targetColumn) {
				// Column not found — skip these cards
				continue;
			}
			// Get current max order in this column
			const maxOrderResult = await db
				.select({ maxOrder: sql<number>`coalesce(max(${cards.order}), -1)` })
				.from(cards)
				.where(eq(cards.columnId, targetColumn.id as ColumnId));
			let order = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

			for (const card of colCards) {
				const content = card.description
					? `${card.title}\n\n${card.description}`
					: card.title;
				const [dbCard] = await db
					.insert(cards)
					.values({
						columnId: targetColumn.id as ColumnId,
						content,
						order,
					})
					.returning();
				createdCards.push(dbCard);
				order++;
			}
		}
	}

	return json({
		board,
		columns: createdColumns,
		cards: createdCards,
	}, { status: 201 });
};

/** List all boards (with column & card counts) */
export const GET: RequestHandler = async ({ url }) => {
	const archivedOnly = url.searchParams.get("archived") === "true";

	const allBoards = await db
		.select({
			id: boards.id,
			name: boards.name,
			description: boards.description,
			projectId: boards.projectId,
			archived: boards.archived,
			createdAt: boards.createdAt,
		})
		.from(boards)
		.where(archivedOnly ? eq(boards.archived, true) : undefined);

	return json(allBoards);
};
