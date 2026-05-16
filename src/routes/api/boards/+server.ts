import { json } from "@sveltejs/kit";
import db from "$db";
import { boards } from "$db/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { ProjectId } from "$types/ids";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	const raw = await request.json();
	const { projectId, name } = raw as { projectId: string; name: string };

	if (!projectId || !name) {
		return json({ error: "Missing projectId or name" }, { status: 400 });
	}

	let parsedProjectId: string;
	try {
		parsedProjectId = v.parse(ProjectId, projectId);
	} catch {
		return json({ error: "Invalid projectId format" }, { status: 400 });
	}

	const [newBoard] = await db
		.insert(boards)
		.values({
			projectId: parsedProjectId,
			name,
		})
		.returning();

	return json(newBoard);
};

export const GET: RequestHandler = async ({ url }) => {
	const rawProjectId = url.searchParams.get("projectId");

	if (!rawProjectId) {
		return json({ error: "Missing projectId" }, { status: 400 });
	}

	let parsedProjectId: string;
	try {
		parsedProjectId = v.parse(ProjectId, rawProjectId);
	} catch {
		return json({ error: "Invalid projectId format" }, { status: 400 });
	}

	const projectBoards = await db.query.boards.findMany({
		where: eq(boards.projectId, parsedProjectId),
	});

	return json(projectBoards);
};
