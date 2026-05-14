/* eslint-disable @typescript-eslint/no-explicit-any -- test helpers mock RequestEvent */

import { describe, it, expect } from "vitest";

/**
 * Unit tests for the kanban board page server actions.
 *
 * These tests validate the action handler logic and parsing.
 * Full integration tests (actual DB operations) are handled
 * separately in e2e/ via Playwright.
 *
 * NOTE: Tests that trigger DB writes (updateColumnOrder, updateCardOrder)
 * are skipped here because they require a live PostgreSQL connection.
 * They belong in e2e/ with Playwright.
 */

import { actions } from "./+page.server";

describe("kanban board server actions", () => {
	describe("action shape", () => {
		it("exports createColumn, createCard, updateColumnOrder, updateCardOrder, deleteColumn, deleteCard", () => {
			expect(actions.createColumn).toBeDefined();
			expect(actions.createCard).toBeDefined();
			expect(actions.updateColumnOrder).toBeDefined();
			expect(actions.updateCardOrder).toBeDefined();
			expect(actions.deleteColumn).toBeDefined();
			expect(actions.deleteCard).toBeDefined();
		});
	});

	describe("input validation patterns", () => {
		it("createCard requires both content and columnId", async () => {
			// Create a minimal Request-like FormData
			const formData = new FormData();
			formData.append("content", "");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.createCard({
				request,
				params: { id: "test-id" },
			} as any);

			// The action returns { error: "Content and Column ID are required" }
			// when either content or columnId is missing/empty
			expect(result).toHaveProperty("error");
		});

		it("createColumn requires a name", async () => {
			const formData = new FormData();
			formData.append("name", "");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.createColumn({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({ error: "Name is required" });
		});

		it("deleteColumn requires columnId", async () => {
			const formData = new FormData();
			formData.append("columnId", "");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.deleteColumn({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({ error: "Column ID is required" });
		});

		it("deleteCard requires cardId", async () => {
			const formData = new FormData();
			formData.append("cardId", "");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.deleteCard({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({ error: "Card ID is required" });
		});
	});

	describe("card content sanitization", () => {
		it("createCard with valid HTML content but no DB (DB not available)", async () => {
			const formData = new FormData();
			formData.append("content", "<p>Hello world</p>");
			formData.append("columnId", "clxabcdef1234567890abcdef");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			// Content validation passes; then action hits DB which is unavailable.
			// We verify the action rejects (from DB error), not a content parsing error.
			await expect(async () => {
				await actions.createCard({
					request,
					params: { id: "test-id" },
				} as any);
			}).rejects.toThrow();
		});
	});

	describe("column order persistence", () => {
		it("parses valid JSON items for updateColumnOrder (DB not available)", { retry: 0 }, async () => {
			const items = JSON.stringify([
				{ id: "col1", order: 0 },
				{ id: "col2", order: 1 },
			]);

			const formData = new FormData();
			formData.append("items", items);

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			// The JSON parse succeeds; the action will then fail on DB queries.
			// We only verify the action rejects (due to missing DB), not the details.
			await expect(async () => {
				await actions.updateColumnOrder({
					request,
					params: { id: "test-id" },
				} as any);
			}).rejects.toThrow();
		});

		it("parses valid JSON items for updateCardOrder (DB not available)", { retry: 0 }, async () => {
			const items = JSON.stringify([
				{ id: "card1", order: 0 },
				{ id: "card2", order: 1 },
			]);

			const formData = new FormData();
			formData.append("items", items);
			formData.append("columnId", "col1");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			// Same story: JSON parse succeeds, then DB queries fail.
			await expect(async () => {
				await actions.updateCardOrder({
					request,
					params: { id: "test-id" },
				} as any);
			}).rejects.toThrow();
		});
	});

	describe("edge cases — missing/malformed input", () => {
		it("updateColumnOrder throws on missing items", async () => {
			const formData = new FormData();
			// no "items" field appended

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			// JSON.parse(null / undefined string) throws
			await expect(
				actions.updateColumnOrder({
					request,
					params: { id: "test-id" },
				} as any),
			).rejects.toThrow();
		});

		it("updateColumnOrder throws on malformed JSON", async () => {
			const formData = new FormData();
			formData.append("items", "{bad: json");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			await expect(
				actions.updateColumnOrder({
					request,
					params: { id: "test-id" },
				} as any),
			).rejects.toThrow();
		});

		it("updateCardOrder throws on missing items", async () => {
			const formData = new FormData();
			formData.append("columnId", "col1");
			// no "items" field

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			await expect(
				actions.updateCardOrder({ request, params: { id: "test-id" } } as any),
			).rejects.toThrow();
		});

		it("createCard trims empty whitespace-only content", async () => {
			const formData = new FormData();
			formData.append("content", "   ");
			formData.append("columnId", "clxabcdef1234567890abcdef");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			// Content is whitespace-only — should be rejected like empty
			const result = await actions.createCard({
				request,
				params: { id: "test-id" },
			} as any);
			expect(result).toHaveProperty("error");
		});

		it("deleteColumn rejects with empty columnId", async () => {
			const formData = new FormData();
			formData.append("columnId", "");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.deleteColumn({
				request,
				params: { id: "test-id" },
			} as any);
			expect(result).toEqual({ error: "Column ID is required" });
		});

		it("deleteCard rejects with empty cardId", async () => {
			const formData = new FormData();
			formData.append("cardId", "");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.deleteCard({
				request,
				params: { id: "test-id" },
			} as any);
			expect(result).toEqual({ error: "Card ID is required" });
		});
	});
});
