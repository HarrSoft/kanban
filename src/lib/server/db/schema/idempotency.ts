import * as t from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { id, unixNow, timestamps } from "./util";
import { IdempotencyKeyId, ProjectId } from "../../../types"; // drizzle-kit can't handle path aliases

/**
 * Idempotency keys for the Agent API.
 *
 * When a mutation request includes an `Idempotency-Key` header, the server
 * stores the response on first processing. Subsequent requests with the same
 * key (same project, method, and path) return the stored response without
 * re-executing the mutation.
 *
 * Keys auto-expire after 24 hours (cleaned up by expiration timestamp).
 */
export const idempotencyKeys = t.pgTable("idempotency_keys", {
	id: id().primaryKey().$type<IdempotencyKeyId>(),
	projectId: t
		.text("project_id")
		.references(() => projects.id)
		.notNull()
		.$type<ProjectId>(),
	key: t.text("key").notNull(),
	method: t.text("method").notNull(),
	path: t.text("path").notNull(),
	responseStatus: t.integer("response_status").notNull(),
	responseBody: t.text("response_body").notNull(),
	expiresAt: t.bigint("expires_at", { mode: "number" })
		.notNull()
		.$default(() => unixNow() + 86400), // 24 hours from creation
	...timestamps,
});
