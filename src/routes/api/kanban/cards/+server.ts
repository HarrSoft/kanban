import { json } from "@sveltejs/kit";
import db from "$db";
import { cards, columns } from "$db/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { CardId, ColumnId } from "$types/ids";
import type { RequestHandler } from "./$types";

const CreateCardSchema = v.object({
	columnId: v.pipe(v.string("columnId is required"), v.minLength(1, "columnId cannot be empty")),
	content: v.pipe(v.string("content is required"), v.minLength(1, "content cannot be empty")),
});

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.json();

	const parsed = v.safeParse(CreateCardSchema, raw);
	if (!parsed.success) {
		const issues = parsed.issues.map(i => i.message).join("; ");
		return json({ error: issues }, { status: 400 });
	}

	const { columnId: rawColumnId, content } = parsed.output;

	let columnId: ColumnId;
	try {
		columnId = v.parse(ColumnId, rawColumnId);
	} catch {
		return json({ error: "Invalid columnId format" }, { status: 400 });
	}

	// Verify column exists
	const column = await db.query.columns.findFirst({
		where: eq(columns.id, columnId),
	});
	if (!column) {
		return json({ error: "Column not found" }, { status: 404 });
	}

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
		.returning();

	return json(newCard, { status: 201 });
};

/** List cards in a column */
export const GET: RequestHandler = async ({ url }) => {
	const rawColumnId = url.searchParams.get("columnId");

	if (!rawColumnId) {
		return json({ error: "Missing columnId query parameter" }, { status: 400 });
	}

	let columnId: ColumnId;
	try {
		columnId = v.parse(ColumnId, rawColumnId);
	} catch {
		return json({ error: "Invalid columnId format" }, { status: 400 });
	}

	const columnCards = await db.query.cards.findMany({
		where: eq(cards.columnId, columnId),
		orderBy: (cards, { asc }) => [asc(cards.order)],
	});

	return json(columnCards);
};
