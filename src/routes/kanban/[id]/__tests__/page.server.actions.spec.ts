import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Regression test for the updateCard / updateCardDescription guard
 * (open-loop `kanban-updatecard-missing-id-crash`).
 *
 * A write against a missing/typo'd card id used to affect 0 rows yet still
 * return `{ success: true }`, and the follow-up activity log (FK to cards.id)
 * rejected unhandled and crashed the dev server. Both actions must now verify
 * the card exists and return an error instead of a false success.
 */

const mocks = vi.hoisted(() => ({
	findFirst: vi.fn(),
	updateWhere: vi.fn(),
	logCardActivity: vi.fn(),
}));

vi.mock("$db", () => ({
	default: {
		query: { cards: { findFirst: mocks.findFirst } },
		update: () => ({ set: () => ({ where: mocks.updateWhere }) }),
	},
}));

vi.mock("$db/schema", () => ({
	boards: {},
	columns: {},
	cards: {},
	cardAssignees: {},
	cardComments: {},
	cardLabels: {},
	labels: {},
	projectMembers: {},
	users: {},
	cardActivity: {},
}));

vi.mock("$db/schema/util", () => ({
	unixNow: () => 1_700_000_000,
}));

vi.mock("$lib/server/actions/card-activity", () => ({
	logCardActivity: mocks.logCardActivity,
}));

const { actions } = await import("../+page.server");

function updateRequest(form: Record<string, string>): Request {
	const fd = new FormData();
	for (const [k, v] of Object.entries(form)) fd.append(k, v);
	return new Request("http://localhost/kanban/board1", {
		method: "POST",
		body: fd,
	});
}

describe("updateCard guard", () => {
	beforeEach(() => {
		mocks.findFirst.mockReset();
		mocks.updateWhere.mockReset();
		mocks.logCardActivity.mockReset().mockResolvedValue(undefined);
	});

	it("returns 'Card not found' for a missing card id and does not write", async () => {
		mocks.findFirst.mockResolvedValue(null);

		const result = await actions.updateCard({
			request: updateRequest({ cardId: "missing", content: "new" }),
		} as never);

		expect(result).toEqual({ error: "Card not found" });
		expect(mocks.updateWhere).not.toHaveBeenCalled();
		expect(mocks.logCardActivity).not.toHaveBeenCalled();
	});

	it("still requires a non-empty card id and content", async () => {
		await expect(
			actions.updateCard({ request: updateRequest({ content: "x" }) } as never),
		).resolves.toEqual({ error: "Card ID is required" });
		await expect(
			actions.updateCard({
				request: updateRequest({ cardId: "card1" }),
			} as never),
		).resolves.toEqual({ error: "Content cannot be empty" });
		expect(mocks.findFirst).not.toHaveBeenCalled();
	});

	it("updates and logs only when the card exists", async () => {
		mocks.findFirst.mockResolvedValue({ id: "card1" });
		mocks.updateWhere.mockResolvedValue(undefined);

		const result = await actions.updateCard({
			request: updateRequest({ cardId: "card1", content: "new" }),
		} as never);

		expect(result).toEqual({ success: true });
		expect(mocks.updateWhere).toHaveBeenCalledOnce();
		expect(mocks.logCardActivity).toHaveBeenCalledOnce();
	});
});

describe("updateCardDescription guard", () => {
	beforeEach(() => {
		mocks.findFirst.mockReset();
		mocks.updateWhere.mockReset();
		mocks.logCardActivity.mockReset().mockResolvedValue(undefined);
	});

	it("returns 'Card not found' for a missing card id", async () => {
		mocks.findFirst.mockResolvedValue(null);

		const result = await actions.updateCardDescription({
			request: updateRequest({ cardId: "missing", description: "d" }),
		} as never);

		expect(result).toEqual({ error: "Card not found" });
		expect(mocks.updateWhere).not.toHaveBeenCalled();
	});
});
