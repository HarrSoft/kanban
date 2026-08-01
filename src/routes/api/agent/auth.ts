import * as argon2 from "argon2";
import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import db, { projectKeys } from "$db";
import { ProjectId } from "$types";

export interface AgentAuth {
	projectId: ProjectId;
	keyId: string;
}

/**
 * Authenticate an agent API request using `Authorization: Bearer <keyId>:<rawKey>`.
 * Throws 401 if invalid.
 * Returns the authenticated project context.
 */
export async function authenticateAgent(event: RequestEvent): Promise<AgentAuth> {
	const header = event.request.headers.get("Authorization");

	if (!header) {
		throw error(401, "Missing Authorization header");
	}

	const [scheme, creds] = header.split(" ");
	if (scheme.toLowerCase() !== "bearer") {
		throw error(400, "Authorization scheme must be Bearer");
	}
	if (!creds) {
		throw error(400, "Missing credentials after Bearer scheme");
	}

	const [keyId, rawKey] = creds.split(":");
	if (!keyId || !rawKey) {
		throw error(400, "Credentials must be in keyId:rawKey format");
	}

	const [keyRecord] = await db
		.select({
			projectId: projectKeys.projectId,
			keyHash: projectKeys.keyHash,
		})
		.from(projectKeys)
		.where(eq(projectKeys.keyId, keyId));

	if (!keyRecord) {
		throw error(401, "Invalid API key");
	}

	const valid = await argon2.verify(keyRecord.keyHash, rawKey);
	if (!valid) {
		throw error(401, "Invalid API key");
	}

	return {
		projectId: keyRecord.projectId as ProjectId,
		keyId,
	};
}
