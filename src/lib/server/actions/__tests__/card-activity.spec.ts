import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Regression test for the updateCard dev-server crash (open-loop
 * `kanban-updatecard-missing-id-crash`).
 *
 * `logCardActivity` inserts into `card_activity`, which has an FK to `cards.id`.
 * When a caller logged activity for a card that does not exist, the insert
 * rejected. Most callers fire-and-forget, so that rejection escaped as an
 * unhandled promise rejection and killed the process. Logging activity is
 * best-effort: it must fail loudly in the log, never reject.
 */

const mocks = vi.hoisted(() => ({
	insertValues: vi.fn(),
}));

vi.mock("$db", () => ({
	default: {
		insert: () => ({ values: mocks.insertValues }),
	},
}));

vi.mock("$db/schema", () => ({
	cardActivity: {},
}));

vi.mock("$db/schema/util", () => ({
	unixNow: () => 1_700_000_000,
}));

const { logCardActivity } = await import("../card-activity");

describe("logCardActivity", () => {
	let errSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		mocks.insertValues.mockReset();
		errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		errSpy.mockRestore();
	});

	it("resolves on the happy path", async () => {
		mocks.insertValues.mockResolvedValue(undefined);

		await expect(
			logCardActivity("card1" as never, "card_content_updated"),
		).resolves.toBeUndefined();
		expect(mocks.insertValues).toHaveBeenCalledOnce();
	});

	it("does not reject when the insert rejects (missing card / FK violation)", async () => {
		mocks.insertValues.mockRejectedValue(new Error("fk violation"));

		await expect(
			logCardActivity("missing" as never, "card_content_updated"),
		).resolves.toBeUndefined();
		expect(errSpy).toHaveBeenCalled();
	});

	it("never throws synchronously on a rejected insert", async () => {
		mocks.insertValues.mockRejectedValue("boom");

		let threw = false;
		try {
			await logCardActivity("missing" as never, "card_moved");
		} catch {
			threw = true;
		}
		expect(threw).toBe(false);
	});
});
