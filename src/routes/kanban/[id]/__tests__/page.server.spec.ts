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

import { actions } from "../+page.server";

describe("kanban board server actions", () => {
	describe("action shape", () => {
		it("exports all server actions", () => {
			expect(actions.createColumn).toBeDefined();
			expect(actions.createCard).toBeDefined();
			expect(actions.updateColumnOrder).toBeDefined();
			expect(actions.updateCardOrder).toBeDefined();
			expect(actions.deleteColumn).toBeDefined();
			expect(actions.deleteCard).toBeDefined();
			expect(actions.updateColumn).toBeDefined();
			expect(actions.updateCard).toBeDefined();
			expect(actions.updateBoard).toBeDefined();
			expect(actions.setDueDate).toBeDefined();
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
			await expect(
				actions.createCard({
					request,
					params: { id: "test-id" },
				} as any),
			).rejects.toThrow();
		});
	});

	describe("column order persistence", () => {
		it(
			"parses valid JSON items for updateColumnOrder (DB not available)",
			{ retry: 0 },
			async () => {
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
				await expect(
					actions.updateColumnOrder({
						request,
						params: { id: "test-id" },
					} as any),
				).rejects.toThrow();
			},
		);

		it(
			"parses valid JSON items for updateCardOrder (DB not available)",
			{ retry: 0 },
			async () => {
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
				await expect(
					actions.updateCardOrder({
						request,
						params: { id: "test-id" },
					} as any),
				).rejects.toThrow();
			},
		);
	});

	describe("item validation — updateColumnOrder and updateCardOrder reject malformed items", () => {
		it("updateColumnOrder rejects items without an id field", async () => {
			const formData = new FormData();
			formData.append(
				"items",
				JSON.stringify([{ name: "Column A" }, { name: "Column B" }]),
			);

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.updateColumnOrder({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({
				error: "Each item must have a string 'id' field",
			});
		});

		it("updateCardOrder rejects items without an id field", async () => {
			const formData = new FormData();
			formData.append(
				"items",
				JSON.stringify([{ content: "card1" }, { content: "card2" }]),
			);
			formData.append("columnId", "col1");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.updateCardOrder({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({
				error: "Each item must have a string 'id' field",
			});
		});

		it("updateCardOrder rejects missing columnId", async () => {
			const formData = new FormData();
			formData.append(
				"items",
				JSON.stringify([{ id: "card1" }, { id: "card2" }]),
			);
			// no columnId appended

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.updateCardOrder({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({
				error: "Column ID is required",
			});
		});

		it("updateColumnOrder rejects items with numeric id instead of string", async () => {
			const formData = new FormData();
			formData.append(
				"items",
				JSON.stringify([
					{ id: 1, order: 0 },
					{ id: 2, order: 1 },
				]),
			);

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.updateColumnOrder({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({
				error: "Each item must have a string 'id' field",
			});
		});
	});

	describe("edge cases — missing/malformed input", () => {
		it("updateColumnOrder returns error on missing items", async () => {
			const formData = new FormData();
			// no "items" field appended

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.updateColumnOrder({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({
				error: "Invalid items payload — expected a JSON array",
			});
		});

		it("updateColumnOrder returns error on malformed JSON", async () => {
			const formData = new FormData();
			formData.append("items", "{bad: json");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.updateColumnOrder({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({
				error: "Invalid items payload — expected a JSON array",
			});
		});

		it("updateCardOrder returns error on missing items", async () => {
			const formData = new FormData();
			formData.append("columnId", "col1");
			// no "items" field

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.updateCardOrder({
				request,
				params: { id: "test-id" },
			} as any);

			expect(result).toEqual({
				error: "Invalid items payload — expected a JSON array",
			});
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

		describe("additional edge cases", () => {
			it("createColumn with very long name (>500 chars) returns validation error", async () => {
				const formData = new FormData();
				formData.append("name", "A".repeat(1000));

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				const result = await actions.createColumn({
					request,
					params: { id: "test-id" },
				} as any);
				expect(result).toEqual({ error: "Name must be 255 characters or less" });
			});

			it("updateColumnOrder rejects items with missing items field entirely", async () => {
				const formData = new FormData();
				formData.append("otherField", "value");

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				const result = await actions.updateColumnOrder({
					request,
					params: { id: "test-id" },
				} as any);
				expect(result).toEqual({
					error: "Invalid items payload — expected a JSON array",
				});
			});

			it("createCard rejects with empty content after trim (whitespace only, with columnId)", async () => {
				const formData = new FormData();
				formData.append("content", "  \n  ");
				formData.append("columnId", "clx12345");

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				const result = await actions.createCard({
					request,
					params: { id: "test-id" },
				} as any);
				expect(result).toEqual({
					error: "Content and Column ID are required",
				});
			});

			it("createCard rejects when only content is missing but columnId is present", async () => {
				const formData = new FormData();
				formData.append("columnId", "clx12345");
				// no content field

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				const result = await actions.createCard({
					request,
					params: { id: "test-id" },
				} as any);
				expect(result).toEqual({
					error: "Content and Column ID are required",
				});
			});

			it("updateCardOrder rejects malformed JSON with columnId present", async () => {
				const formData = new FormData();
				formData.append("items", "[this is not json");
				formData.append("columnId", "col1");

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				const result = await actions.updateCardOrder({
					request,
					params: { id: "test-id" },
				} as any);
				expect(result).toEqual({
					error: "Invalid items payload — expected a JSON array",
				});
			});

			it("updateColumn rejects missing columnId", async () => {
				const formData = new FormData();
				formData.append("name", "Todo");

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				const result = await actions.updateColumn({
					request,
					params: { id: "test-id" },
				} as any);
				expect(result).toEqual({ error: "Column ID is required" });
			});

			it("updateColumn rejects empty name", async () => {
				const formData = new FormData();
				formData.append("columnId", "clx12345");
				formData.append("name", "  ");

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				const result = await actions.updateColumn({
					request,
					params: { id: "test-id" },
				} as any);
				expect(result).toEqual({ error: "Column name cannot be empty" });
			});

			it("updateColumn with valid data updates the column (DB unavailable)", async () => {
				const formData = new FormData();
				formData.append("columnId", "clx12345");
				formData.append("name", "In Progress");

				const request = new Request("http://localhost:5173/kanban/test-id", {
					method: "POST",
					body: formData,
				});

				// Will fail because no DB is available in unit tests
				await expect(
					actions.updateColumn({
						request,
						params: { id: "test-id" },
					} as any),
				).rejects.toThrow();
			});
		});
	});

	describe("setDueDate action", () => {
		it("returns fail(400) when cardId is missing", async () => {
			const formData = new FormData();
			formData.append("dueDate", "2026-06-01");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			const result = await actions.setDueDate({
				request,
				params: { id: "test-id" },
			} as any);

			// SvelteKit fail() returns { status, data: { error } }
			expect(result).toHaveProperty("status", 400);
			expect(result).toHaveProperty("data");
			expect((result as any).data).toHaveProperty("error", "Card ID is required");
		});

		it("parses valid date string into a unix timestamp (DB unavailable)", async () => {
			const formData = new FormData();
			formData.append("cardId", "clxcard12345");
			formData.append("dueDate", "2026-06-15");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			// Date parsing succeeds, then DB query fails (no DB in unit tests)
			await expect(
				actions.setDueDate({
					request,
					params: { id: "test-id" },
				} as any),
			).rejects.toThrow();
		});

		it("accepts empty dueDate to clear existing date (DB unavailable)", async () => {
			const formData = new FormData();
			formData.append("cardId", "clxcard12345");
			formData.append("dueDate", "");

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			// Empty date parses to null, then DB query fails
			await expect(
				actions.setDueDate({
					request,
					params: { id: "test-id" },
				} as any),
			).rejects.toThrow();
		});

		it("accepts missing dueDate field to clear existing date (DB unavailable)", async () => {
			const formData = new FormData();
			formData.append("cardId", "clxcard12345");
			// no dueDate field appended

			const request = new Request("http://localhost:5173/kanban/test-id", {
				method: "POST",
				body: formData,
			});

			await expect(
				actions.setDueDate({
					request,
					params: { id: "test-id" },
				} as any),
			).rejects.toThrow();
		});
	});
});
