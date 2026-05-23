import { json } from "@sveltejs/kit";
import * as df from "date-fns";
import { eq, and, gt } from "drizzle-orm";
import db, { idempotencyKeys } from "$db";
import type { AgentAuth } from "./auth";

const unixNow = () => df.getUnixTime(new Date());

/**
 * Check if an idempotent request has already been processed.
 *
 * Returns the stored response (status + body) if the key exists and hasn't
 * expired, or null if this is a fresh request that should be processed.
 */
export async function getIdempotencyResponse(
	auth: AgentAuth,
	method: string,
	path: string,
	key: string | null,
): Promise<{ status: number; body: Record<string, unknown> } | null> {
	if (!key) return null;

	const now = unixNow();

	const [record] = await db
		.select({
			responseStatus: idempotencyKeys.responseStatus,
			responseBody: idempotencyKeys.responseBody,
			expiresAt: idempotencyKeys.expiresAt,
		})
		.from(idempotencyKeys)
		.where(
			and(
				eq(idempotencyKeys.projectId, auth.projectId),
				eq(idempotencyKeys.key, key),
				eq(idempotencyKeys.method, method),
				eq(idempotencyKeys.path, path),
				gt(idempotencyKeys.expiresAt, now),
			),
		)
		.limit(1);

	if (!record) return null;

	try {
		const body = JSON.parse(record.responseBody) as Record<string, unknown>;
		return { status: record.responseStatus, body };
	} catch {
		// If stored JSON is corrupt, treat as cache miss
		return null;
	}
}

/**
 * Record the result of an idempotent request for future lookup.
 *
 * This should be called after the mutation handler successfully processes
 * the request and generates a response.
 */
export async function recordIdempotencyResult(
	auth: AgentAuth,
	method: string,
	path: string,
	key: string,
	status: number,
	body: Record<string, unknown>,
): Promise<void> {
	const now = unixNow();

	await db.insert(idempotencyKeys).values({
		projectId: auth.projectId,
		key,
		method,
		path,
		responseStatus: status,
		responseBody: JSON.stringify(body),
		createdAt: now,
		updatedAt: now,
		expiresAt: now + 86400, // 24 hours
	});
}

/**
 * Send an idempotency-stored response back to the client.
 */
export function sendIdempotencyResponse(result: {
	status: number;
	body: Record<string, unknown>;
}): Response {
	return json(result.body, { status: result.status });
}

/**
 * Purge expired idempotency keys from the database.
 * Call this periodically (e.g., via a low-traffic cron or on startup).
 */
export async function purgeExpiredIdempotencyKeys(): Promise<number> {
	const now = unixNow();
	const result = await db
		.delete(idempotencyKeys)
		.where(gt(idempotencyKeys.expiresAt, now))
		.returning({ id: idempotencyKeys.id });
	return result.length;
}
