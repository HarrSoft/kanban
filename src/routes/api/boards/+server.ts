import { json } from "@sveltejs/kit";
import { db } from "$db";
import { boards } from "$db/schema";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
    const { projectId, name } = await request.json();

    if (!projectId || !name) {
        return json({ error: "Missing projectId or name" }, { status: 400 });
    }

    const [newBoard] = await db.insert(boards).values({
        projectId,
        name,
    }).returning();

    return json(newBoard);
};

export const GET: RequestHandler = async ({ url }) => {
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
        return json({ error: "Missing projectId" }, { status: 400 });
    }

    const projectBoards = await db.query.boards.findMany({
        where: eq(boards.projectId, projectId),
    });

    return json(projectBoards);
};
