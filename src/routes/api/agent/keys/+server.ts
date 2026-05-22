import * as argon2 from "argon2";
import * as v from "valibot";
import { randomBytes } from "node:crypto";
import { json } from "@sveltejs/kit";
import db, { projectKeys } from "$db";
import { isLoggedIn } from "../../rules";
import { cuid2 } from "$server/crypto";
import { ProjectId } from "$types";
import type { RequestHandler } from "../$types";

/** POST /api/agent/keys — generate a new API key for a project.
 * Requires an active user session (not agent auth).
 * Returns the raw API key exactly once — store it immediately.
 */
export const POST: RequestHandler = async ({ request }) => {
	isLoggedIn();

	const raw = await request.json();
	const { projectId } = raw as { projectId: string };

	if (!projectId) {
		return json({ error: "Missing projectId" }, { status: 400 });
	}

	let parsedProjectId: ProjectId;
	try {
		parsedProjectId = v.parse(ProjectId, projectId);
	} catch {
		return json({ error: "Invalid projectId format" }, { status: 400 });
	}

	// generate a raw API key (64 hex chars = 256 bits)
	const rawKey = randomBytes(32).toString("hex");
	const keyHash = await argon2.hash(rawKey);

	const keyId = cuid2();

	await db.insert(projectKeys).values({
		keyId,
		projectId: parsedProjectId,
		keyHash,
	});

	return json({
		keyId,
		rawKey,
		message:
			"This key will not be shown again. Store it somewhere safe.",
	});
};

/** GET /api/agent/keys — list API keys for a project (shows keyId + created date, NOT raw keys). */
export const GET: RequestHandler = async ({ url }) => {
	isLoggedIn();

	const rawProjectId = url.searchParams.get("projectId");

	if (!rawProjectId) {
		return json({ error: "Missing projectId" }, { status: 400 });
	}

	let parsedProjectId: ProjectId;
	try {
		parsedProjectId = v.parse(ProjectId, rawProjectId);
	} catch {
		return json({ error: "Invalid projectId format" }, { status: 400 });
	}

	const keys = await db.query.projectKeys.findMany({
		where: (pk, { eq }) => eq(pk.projectId, parsedProjectId),
		columns: {
			keyId: true,
			projectId: true,
			createdAt: true,
		},
	});

	return json(keys);
};

/** DELETE /api/agent/keys — revoke an API key. */
export const DELETE: RequestHandler = async ({ request }) => {
	isLoggedIn();

	const raw = await request.json();
	const { keyId } = raw as { keyId: string };

	if (!keyId) {
		return json({ error: "Missing keyId" }, { status: 400 });
	}

	const result = await db
		.delete(projectKeys)
		.where((pk, { eq }) => eq(pk.keyId, keyId));

	return json({ deleted: true });
};
