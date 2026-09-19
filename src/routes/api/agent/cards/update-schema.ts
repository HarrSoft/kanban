import * as v from "valibot";

/**
 * Validation for the agent card-update route (`PATCH /api/agent/cards/[cardId]`).
 *
 * Kept in its own module so the request shape can be unit-tested without a DB
 * (the route's DB scoping is exercised in e2e). Mirrors the create route's
 * constraints: content ≤ 500 chars, trimmed, non-empty when present.
 */

export const CARD_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const MAX_CONTENT = 500;

export const UpdateCardSchema = v.object({
	content: v.optional(
		v.pipe(
			v.string("content must be a string"),
			v.trim(),
			v.minLength(1, "content cannot be empty"),
			v.maxLength(MAX_CONTENT, `content exceeds ${MAX_CONTENT} characters`),
		),
	),
	columnId: v.optional(
		v.pipe(
			v.string("columnId must be a string"),
			v.minLength(1, "columnId cannot be empty"),
		),
	),
	order: v.optional(
		v.pipe(
			v.number("order must be a number"),
			v.integer("order must be an integer"),
		),
	),
	archived: v.optional(v.boolean("archived must be a boolean")),
	priority: v.optional(
		v.picklist(
			CARD_PRIORITIES,
			"priority must be one of low/medium/high/urgent",
		),
	),
	dueDate: v.optional(
		v.nullable(v.number("dueDate must be a unix timestamp or null")),
	),
});

export type CardUpdate = v.InferOutput<typeof UpdateCardSchema>;

/**
 * Parse and validate a PATCH body. Returns the cleaned patch (only the fields
 * actually provided) or an error message. An empty patch is an error: a request
 * that changes nothing is a mistake, not a no-op to silently accept.
 */
export function validateCardUpdate(
	raw: unknown,
):
	| { ok: true; patch: CardUpdate; keys: string[] }
	| { ok: false; error: string } {
	const parsed = v.safeParse(UpdateCardSchema, raw);
	if (!parsed.success) {
		const issues = parsed.issues.map(i => i.message).join("; ");
		return { ok: false, error: issues || "invalid request body" };
	}
	const keys = Object.keys(parsed.output).filter(
		k => (parsed.output as Record<string, unknown>)[k] !== undefined,
	);
	if (keys.length === 0) {
		return {
			ok: false,
			error:
				"no updatable fields provided (expected one of: content, columnId, order, archived, priority, dueDate)",
		};
	}
	return { ok: true, patch: parsed.output, keys };
}
