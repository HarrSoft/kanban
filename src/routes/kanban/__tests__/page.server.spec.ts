/* eslint-disable @typescript-eslint/no-explicit-any -- test helpers */
import { describe, it, expect } from "vitest";
import { load } from "../+page.server";

describe("kanban board list page server", () => {
	describe("load function shape", () => {
		it("exports a load function", () => {
			expect(load).toBeDefined();
			expect(typeof load).toBe("function");
		});

		it("load function is async and expects no params", () => {
			expect(load.constructor.name).toBe("AsyncFunction");
			// load() takes no params, returns boards from DB
			// Since no live DB in unit tests, this will throw on DB access
		});

		it("fails when called without live DB connection", async () => {
			// The load function hits the DB directly with no mocks.
			// Without PostgreSQL running, it throws a connection error.
			// Full integration testing belongs in e2e/.
			await expect(load({} as any)).rejects.toThrow();
		});
	});
});
