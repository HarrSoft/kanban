import { json } from "@sveltejs/kit";
import db from "$db";
import { boards, columns as columnsSchema, projects, cards } from "$db/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { ProjectId, BoardId } from "$types/ids";
import type { RequestHandler } from "./$types";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

const CreateBoardSchema = v.object({
	projectId: v.optional(v.string(), ""),
	name: v.pipe(v.string("name is required"), v.minLength(1, "name cannot be empty")),
	description: v.optional(v.string(), ""),
	columns: v.optional(v.array(v.string()), DEFAULT_COLUMNS),
	/** Array of card titles to create in the first column */
	cardTitles: v.optional(v.array(v.string()), []),
});

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.json();

	const parsed = v.safeParse(CreateBoardSchema, raw);
	if (!parsed.success) {
		const issues = parsed.issues.map(i => i.message).join("; ");
		return json({ error: issues }, { status: 400 });
	}

	const { name, description, columns: columnNames, cardTitles, projectId } = parsed.output;

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

	// Create cards in first column if provided
	const createdCards = [];
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
