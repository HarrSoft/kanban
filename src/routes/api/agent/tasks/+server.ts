import { json } from "@sveltejs/kit";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import db, { cards, columns, boards, cardAssignees, cardLabels, labels } from "$db";
import { authenticateAgent } from "../auth";
import type { RequestHandler } from "../$types";
import { BoardId, CardId, UserId } from "$types";

/**
 * GET /api/agent/tasks — list cards with filters for the authenticated project.
 *
 * Query params (all optional):
 *   board      — filter by board ID (repeatable: ?board=a&board=b)
 *   dueBefore  — unix timestamp: return cards with dueDate <= this
 *   dueAfter   — unix timestamp: return cards with dueDate >= this
 *   includeArchived — if "true", include archived cards (default: false)
 *   assignee   — filter by user ID (repeatable: ?assignee=x&assignee=y)
 *   label      — filter by label ID (repeatable: ?label=x&label=y)
 *   limit      — max results (default 50, max 200)
 *   offset     — pagination offset (default 0)
 *
 * Response: { tasks: Task[], total: number }
 */
export const GET: RequestHandler = async (event) => {
	const { projectId } = await authenticateAgent(event);

	const url = event.url;
	const boardIds = url.searchParams.getAll("board") as BoardId[];
	const dueBefore = url.searchParams.get("dueBefore");
	const dueAfter = url.searchParams.get("dueAfter");
	const includeArchived = url.searchParams.get("includeArchived") === "true";
	const assigneeIds = url.searchParams.getAll("assignee") as UserId[];
	const labelIds = url.searchParams.getAll("label") as CardId[];
	const rawLimit = Math.min(
		Math.max(1, Number(url.searchParams.get("limit")) || 50),
		200,
	);
	const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

	// Build WHERE conditions
	const conditions = sql`${cards.id} is not null`; // always-true base

	// Scope to project boards
	conditions.append(sql` and ${eq(boards.projectId, projectId)}`);

	// Filter by board
	if (boardIds.length > 0) {
		conditions.append(sql` and ${inArray(columns.boardId, boardIds)}`);
	}

	// Filter archived
	if (!includeArchived) {
		conditions.append(sql` and ${eq(cards.archived, false)}`);
	}

	// Filter by due date range
	if (dueBefore) {
		const ts = Number(dueBefore);
		if (!isNaN(ts)) {
			conditions.append(sql` and ${sql`cards.due_date <= ${ts}`}`);
		}
	}
	if (dueAfter) {
		const ts = Number(dueAfter);
		if (!isNaN(ts)) {
			conditions.append(sql` and ${sql`cards.due_date >= ${ts}`}`);
		}
	}

	// Filter by assignee — this requires a subquery/subselect because
	// it's a many-to-many relationship
	if (assigneeIds.length > 0) {
		conditions.append(
			sql` and ${cards.id} in (select ${cardAssignees.cardId} from ${cardAssignees} where ${inArray(cardAssignees.userId, assigneeIds)})`,
		);
	}

	// Filter by label
	if (labelIds.length > 0) {
		conditions.append(
			sql` and ${cards.id} in (select ${cardLabels.cardId} from ${cardLabels} where ${inArray(cardLabels.labelId, labelIds)})`,
		);
	}

	// Get total count
	const [{ count }] = await db
		.select({ count: sql<number>`count(distinct ${cards.id})` })
		.from(cards)
		.innerJoin(columns, eq(cards.columnId, columns.id))
		.innerJoin(boards, eq(columns.boardId, boards.id))
		.where(conditions);

	// Get paginated results
	const rows = await db
		.select({
			id: cards.id,
			content: cards.content,
			order: cards.order,
			dueDate: cards.dueDate,
			archived: cards.archived,
			createdAt: cards.createdAt,
			updatedAt: cards.updatedAt,
			columnId: columns.id,
			columnName: columns.name,
			boardId: boards.id,
			boardName: boards.name,
		})
		.from(cards)
		.innerJoin(columns, eq(cards.columnId, columns.id))
		.innerJoin(boards, eq(columns.boardId, boards.id))
		.where(conditions)
		.orderBy(asc(cards.dueDate), asc(cards.order))
		.limit(rawLimit)
		.offset(offset);

	// For each card, load assignees and labels
	const tasks = await Promise.all(
		rows.map(async (row) => {
			const assigneeRows = await db
				.select({ userId: cardAssignees.userId })
				.from(cardAssignees)
				.where(eq(cardAssignees.cardId, row.id));

			const labelRows = await db
				.select({ labelId: cardLabels.labelId, name: labels.name, color: labels.color })
				.from(cardLabels)
				.innerJoin(labels, eq(cardLabels.labelId, labels.id))
				.where(eq(cardLabels.cardId, row.id));

			return {
				id: row.id,
				content: row.content,
				order: row.order,
				dueAt: row.dueDate,
				archived: row.archived,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
				column: {
					id: row.columnId,
					name: row.columnName,
				},
				board: {
					id: row.boardId,
					name: row.boardName,
				},
				assignees: assigneeRows.map((a) => a.userId),
				labels: labelRows.map((l) => ({
					id: l.labelId,
					name: l.name,
					color: l.color,
				})),
			};
		}),
	);

	return json({ tasks, total: Number(count) });
};
