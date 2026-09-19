/**
 * Unit tests for the agent card-update validation
 * (`PATCH /api/agent/cards/[cardId]` -> validateCardUpdate).
 *
 * These exercise the request-shape validation with no DB, mirroring
 * `api/__tests__/boards.spec.ts`: the goal is that malformed input is rejected
 * *before* any DB interaction, and that a valid patch carries exactly the fields
 * the caller provided. DB scoping (card -> column -> board.projectId) and the
 * 404-on-unknown-id path are integration concerns and live in e2e.
 */
import { describe, it, expect } from "vitest";
import { validateCardUpdate, MAX_CONTENT } from "../update-schema";

describe("validateCardUpdate", () => {
	it("accepts a content-only patch and trims it", () => {
		const r = validateCardUpdate({ content: "  fix the thing  " });
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.patch.content).toBe("fix the thing");
			expect(r.keys).toEqual(["content"]);
		}
	});

	it("accepts a multi-field patch (move + close + priority)", () => {
		const r = validateCardUpdate({
			columnId: "col_1",
			archived: true,
			priority: "high",
		});
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.keys.sort()).toEqual(["archived", "columnId", "priority"]);
		}
	});

	it("accepts dueDate as null (clear the date)", () => {
		const r = validateCardUpdate({ dueDate: null });
		expect(r.ok).toBe(true);
	});

	it("rejects an empty object — nothing to change is an error, not a no-op", () => {
		const r = validateCardUpdate({});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/no updatable fields/);
	});

	it("ignores unknown fields — a body of only unknown fields is a no-op error", () => {
		const r = validateCardUpdate({ foo: 1, bar: "x" });
		expect(r.ok).toBe(false);
	});

	it("accepts unknown fields alongside a known one (keys carry only the known field)", () => {
		const r = validateCardUpdate({ content: "ok", foo: 1 });
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.keys).toEqual(["content"]);
	});

	it("rejects content longer than the limit", () => {
		const r = validateCardUpdate({ content: "x".repeat(MAX_CONTENT + 1) });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/exceeds/);
	});

	it("rejects content that is whitespace-only", () => {
		const r = validateCardUpdate({ content: "   " });
		expect(r.ok).toBe(false);
	});

	it("rejects an unknown priority", () => {
		const r = validateCardUpdate({ priority: "sky-high" });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.error).toMatch(/priority/);
	});

	it("rejects a non-integer order", () => {
		const r = validateCardUpdate({ order: 1.5 });
		expect(r.ok).toBe(false);
	});

	it("rejects a non-boolean archived", () => {
		const r = validateCardUpdate({ archived: "yes" });
		expect(r.ok).toBe(false);
	});

	it("rejects an empty columnId", () => {
		const r = validateCardUpdate({ columnId: "" });
		expect(r.ok).toBe(false);
	});
});
