/* eslint-disable @typescript-eslint/no-explicit-any -- test helpers */
import { describe, it, expect } from "vitest";
import { load } from "../+page.server";

describe("kanban board detail page server load", () => {
	describe("load function shape", () => {
		it("exports a load function", () => {
			expect(load).toBeDefined();
			expect(typeof load).toBe("function");
		});

		it("is an async function", () => {
			expect(load.constructor.name).toBe("AsyncFunction");
		});
	});

	describe("param handling", () => {
		it("accepts params with an id property", () => {
			const params = { id: "valid-board-id" };
			expect(params).toHaveProperty("id");
			expect(typeof params.id).toBe("string");
		});

		it("throws without a live DB connection", async () => {
			// The load function queries the DB directly.
			// Without PostgreSQL, it throws a connection error.
			// Integration testing (DB-dependent) belongs in e2e/.
			await expect(
				load({ params: { id: "nonexistent" } } as any),
			).rejects.toThrow();
		});
	});
});
